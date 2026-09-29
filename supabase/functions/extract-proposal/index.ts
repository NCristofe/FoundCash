// Edge Function: lê o PDF de uma proposta e devolve os dados da oportunidade.
//
// O app envia o arquivo (multipart/form-data, campo "file"). O Claude extrai
// cliente, WhatsApp, valor e data; o usuário revisa no formulário antes de salvar.
// Nada é gravado aqui e o PDF não é armazenado.
//
// Variáveis (supabase secrets set ...):
//   ANTHROPIC_API_KEY    chave da API da Anthropic
// (SUPABASE_URL e SUPABASE_ANON_KEY já existem no ambiente.)
//
// Deploy:  npx supabase functions deploy extract-proposal --no-verify-jwt
// (o JWT do usuário é validado abaixo, com supabase.auth.getUser)

import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

const MAX_PDF_BYTES = 10 * 1024 * 1024;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const nullable = (type: 'string' | 'number') => ({ anyOf: [{ type }, { type: 'null' }] });

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    client_name: { ...nullable('string'), description: 'Nome do cliente (pessoa ou empresa) para quem a proposta foi feita.' },
    whatsapp: { ...nullable('string'), description: 'Telefone/WhatsApp do cliente, como aparece no documento.' },
    value: { ...nullable('number'), description: 'Valor total do investimento em reais, sem descontos opcionais.' },
    proposal_date: { ...nullable('string'), description: 'Data de emissão da proposta no formato AAAA-MM-DD.' },
    power_kwp: { ...nullable('number'), description: 'Potência do sistema em kWp, se houver.' },
  },
  required: ['client_name', 'whatsapp', 'value', 'proposal_date', 'power_kwp'],
  additionalProperties: false,
};

const SYSTEM_PROMPT = `Você extrai dados de propostas comerciais (em geral de energia solar) enviadas por integradores brasileiros.

- client_name é o CLIENTE que recebeu a proposta, nunca a empresa que a emitiu, o vendedor ou o engenheiro responsável.
- whatsapp é o telefone do cliente. Ignore os telefones da empresa emissora. Use null se o telefone do cliente não aparecer.
- value é o preço total do sistema/investimento em reais. Se houver mais de uma opção de pagamento, use o valor à vista. Não confunda com economia estimada, parcela ou payback.
- Use null para qualquer campo que não esteja claro no documento. Não invente dados.`;

interface Extracted {
  client_name: string | null;
  whatsapp: string | null;
  value: number | null;
  proposal_date: string | null;
  power_kwp: number | null;
}

function json(body: unknown, status = 200) {
  return Response.json(body, { status, headers: corsHeaders });
}

/** Mesmo formato salvo no banco: só dígitos, com DDI 55 (10 a 15 dígitos). */
function normalizeWhatsapp(raw: string | null): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return /^[0-9]{12,15}$/.test(digits) ? digits : null;
}

function normalize(data: Extracted): Extracted {
  const name = data.client_name?.trim().slice(0, 120) || null;
  const value = typeof data.value === 'number' && data.value > 0 ? Math.round(data.value * 100) / 100 : null;
  const date = data.proposal_date && /^\d{4}-\d{2}-\d{2}$/.test(data.proposal_date) ? data.proposal_date : null;
  const power = typeof data.power_kwp === 'number' && data.power_kwp > 0 ? data.power_kwp : null;
  return { client_name: name, whatsapp: normalizeWhatsapp(data.whatsapp), value, proposal_date: date, power_kwp: power };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Método não permitido.' }, 405);

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: request.headers.get('Authorization') ?? '' } },
    auth: { persistSession: false },
  });
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) return json({ error: 'Faça login novamente.' }, 401);

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return json({ error: 'Envie o PDF da proposta.' }, 400);
  if (file.size > MAX_PDF_BYTES) return json({ error: 'O PDF passa de 10 MB.' }, 413);

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== '%PDF-') {
    return json({ error: 'O arquivo enviado não é um PDF.' }, 400);
  }

  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

  try {
    const response = await anthropic.beta.messages.create({
      model: 'claude-opus-5-5',
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM_PROMPT,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: encodeBase64(bytes) },
            },
            { type: 'text', text: 'Extraia os dados desta proposta.' },
          ],
        },
      ],
    });

    if (response.stop_reason === 'refusal' || response.stop_reason === 'max_tokens') {
      return json({ error: 'Não consegui ler esta proposta. Preencha manualmente.' }, 422);
    }

    const text = response.content.find((block) => block.type === 'text');
    if (!text || text.type !== 'text') return json({ error: 'Não consegui ler esta proposta.' }, 422);

    return json(normalize(JSON.parse(text.text) as Extracted));
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return json({ error: 'Muitas leituras ao mesmo tempo. Tente de novo em instantes.' }, 429);
    }
    if (error instanceof Anthropic.BadRequestError) {
      console.error('extract-proposal: requisição recusada', error.message);
      return json({ error: 'Não consegui ler este PDF (ele pode estar protegido ou corrompido).' }, 422);
    }
    if (error instanceof Anthropic.APIError) {
      console.error('extract-proposal: erro da API', error.status, error.message);
      return json({ error: 'Serviço de leitura indisponível. Tente novamente.' }, 502);
    }
    console.error('extract-proposal: erro inesperado', error);
    return json({ error: 'Não consegui ler esta proposta.' }, 500);
  }
});
