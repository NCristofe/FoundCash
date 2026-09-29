/**
 * Extrai cliente, WhatsApp e valor do texto de uma proposta comercial
 * (em geral de energia solar) usando regras — sem IA e sem serviço externo.
 *
 * Recebe as linhas do PDF na ordem de leitura. Blocos da mesma linha que estão
 * em colunas diferentes chegam separados por COLUMN_SEPARATOR. Cada candidato
 * recebe uma pontuação pelas palavras próximas; vence o de maior pontuação.
 */

export interface ParsedProposal {
  clientName: string | null;
  whatsapp: string | null;
  value: number | null;
}

export const COLUMN_SEPARATOR = ' | ';

const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const columns = (line: string) => line.split(COLUMN_SEPARATOR).map((part) => part.trim());

/* Cliente ----------------------------------------------------------------------- */

/** Rótulos que antecedem o nome do cliente. */
const NAME_LABEL =
  /^(?:nome do cliente|nome\/razao social|razao social|cliente|contratante|nome|proposta (?:comercial )?(?:para|a)|a\/c|aos cuidados de|prezad[oa]s?(?:\s*\(a\))?|sr\.?\s*\(?a?\)?)(?=[\s:\-–]|$)\s*[:\-–]?\s*/;

/** Onde o nome termina quando há outros campos no mesmo trecho. */
const NAME_STOP =
  /\s+(?:cpf|cnpj|tel(?:efone)?\.?|cel(?:ular)?\.?|whats(?:app)?|fone|e-?mail|endere[cç]o|cidade|data|uc|unidade consumidora|consumo)\b.*$/i;

/** Textos que não são nome de cliente (títulos, rótulos, a própria empresa solar). */
const NAME_REJECT =
  /\b(?:energia|solar|fotovoltaic|engenharia|proposta|dados|informac|orcamento|local|instalacao|validade|responsavel|assinatura|consultor)\b/;

function cleanName(raw: string | undefined): string | null {
  if (!raw || /[[\]_]/.test(raw)) return null; // "[Nome do Cliente]", "________"
  const name = raw
    .replace(NAME_STOP, '')
    .replace(/[,;:|(].*$/, '')
    .replace(/[^\p{L}\s.'&-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (name.length < 3 || name.split(' ').length > 8 || NAME_REJECT.test(normalize(name))) return null;
  return (name === name.toUpperCase() ? titleCase(name) : name).slice(0, 120);
}

function titleCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/(^|\s)(\p{L})/gu, (_, space: string, letter: string) => space + letter.toUpperCase())
    .replace(/\s(D[aeo]s?|E)\s/g, (match) => match.toLowerCase())
    .replace(/\b(Ltda|Me|Eireli|S\/?a)\b/g, (match) => (match === 'Ltda' ? match : match.toUpperCase()));
}

/** "Cliente: Maria", "Cliente: | Maria" ou "CLIENTE" com o nome na linha de baixo, na mesma coluna. */
function findLabeledName(lines: string[]): string | null {
  for (let i = 0; i < lines.length; i += 1) {
    const cells = columns(lines[i]);
    for (let col = 0; col < cells.length; col += 1) {
      const label = normalize(cells[col]).match(NAME_LABEL);
      if (!label) continue;

      const rest = cells[col].slice(label[0].length);
      const below = lines[i + 1] ? columns(lines[i + 1]) : [];
      const candidates = rest.trim()
        ? [rest]
        : label[0].includes(':')
          ? [cells[col + 1], below[col]] // "Nome: | Maria" (formulário)
          : [below[col] ?? below[0], cells[col + 1]]; // "CLIENTE" como título de bloco

      for (const candidate of candidates) {
        const name = cleanName(candidate);
        if (name) return name;
      }
    }
  }
  return null;
}

/** Nome impresso acima de "Assinatura do Cliente" (usa a última ocorrência). */
function findSignatureName(lines: string[]): string | null {
  for (let i = lines.length - 1; i > 0; i -= 1) {
    const col = columns(lines[i]).findIndex((cell) => /assinatura do (?:cliente|contratante)/.test(normalize(cell)));
    if (col < 0) continue;
    const above = columns(lines[i - 1]);
    const name = cleanName(above[col] ?? above[0]);
    if (name) return name;
  }
  return null;
}

/** "Proposta - João Silva (2).pdf" → "João Silva". Nomes genéricos ("proposta_energia_solar") são ignorados. */
export function nameFromFileName(fileName: string): string | null {
  const base = fileName
    .replace(/\.pdf$/i, '')
    .replace(/[_\-–.+]+/g, ' ')
    .replace(/\(\d+\)|\b\d+\b|#\S*/g, ' ')
    .replace(/\b(?:proposta|comercial|orcamento|orçamento|final|revisad[oa]|rev|v\d*|versao|versão|cliente|pdf)\b/gi, ' ');
  const name = cleanName(base);
  // Uma palavra só ("scan", "documento") não é confiável como nome.
  if (!name || name.split(' ').length < 2) return null;
  return name === name.toLowerCase() ? titleCase(name) : name;
}

/* WhatsApp ---------------------------------------------------------------------- */

const PHONE = /(?:\+?55[\s.-]*)?\(?\b([1-9]{2})\)?[\s.-]*(9[\s.]?\d{4}|\d{4})[\s.-]?(\d{4})\b/g;
const PHONE_GOOD = /\b(?:cliente|contato|whats(?:app)?|celular|cel|fone|telefone|tel)\b/;
const COMPANY = /\b(?:cnpj|ltda|eireli|www\.|\.com|sac|atendimento|vendedor|consultor|engenheir|responsavel tecnico|crea)\b/;

function findWhatsapp(lines: string[], norm: string[]): string | null {
  const clientSection = norm.findIndex((line) => /\b(?:cliente|contratante)\b/.test(line));
  let best: { phone: string; score: number } | null = null;

  for (let i = 0; i < lines.length; i += 1) {
    const line = norm[i];
    for (const [, ddd, rawFirst, last] of lines[i].matchAll(PHONE)) {
      const first = rawFirst.replace(/\D/g, '');
      let score = 0;
      if (PHONE_GOOD.test(line)) score += 2;
      if (/\bcliente\b/.test(line)) score += 3;
      if (clientSection >= 0 && i >= clientSection && i <= clientSection + 6) score += 3;
      if (first.length === 5 && first.startsWith('9')) score += 2; // celular
      if (COMPANY.test(line) || (i > 0 && COMPANY.test(norm[i - 1]))) score -= 5;
      if (lines.length > 15 && i >= lines.length - 3) score -= 2; // rodapé
      if (!best || score > best.score) best = { phone: `55${ddd}${first}${last}`, score };
    }
  }

  return best && best.score >= 0 ? best.phone : null;
}

/* Valor ------------------------------------------------------------------------- */

const MONEY = /r\$\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/g;
const HAS_MONEY = /r\$\s*\d/;
const VALUE_TOTAL =
  /\b(?:investimento|valor total|valor do sistema|valor da proposta|preco total|total do sistema|total geral|valor final|total)\b/;
const VALUE_CASH = /\b(?:a vista|avista)\b/;
const VALUE_BAD =
  /\b(?:economia|econom\w*|parcela|parcelas|mensal|por mes|ao mes|mes|ano|anos|por ano|ao ano|conta de luz|fatura|gasto|acumulado|payback|retorno|tarifa|kwh|entrada|juros|\d+\s*x)\b/;

/**
 * O valor da proposta é o investimento total. O preço à vista entra como
 * segunda opção (quando a proposta não traz o total).
 */
function findValue(norm: string[]): number | null {
  let best: { value: number; score: number } | null = null;

  for (let i = 0; i < norm.length; i += 1) {
    const cells = columns(norm[i]);
    // Título na linha de cima ("INVESTIMENTO TOTAL" / "R$ 48.500,00") só conta se ela não tiver valores.
    const aboveCells = i > 0 && !HAS_MONEY.test(norm[i - 1]) ? columns(norm[i - 1]) : [];

    for (const match of norm[i].matchAll(MONEY)) {
      const value = Number(match[1].replace(/\./g, '').replace(',', '.'));
      if (!(value >= 1000)) continue; // ignora tarifas, parcelas pequenas etc.

      // Contexto: a célula do valor + o rótulo da linha (1ª coluna) + o título acima, na mesma coluna.
      const col = norm[i].slice(0, match.index).split(COLUMN_SEPARATOR).length - 1;
      const context = col > 0 ? `${cells[0]} ${cells[col]}` : cells[col];
      const above = aboveCells[col] ?? (aboveCells.length === 1 ? aboveCells[0] : '');

      let score = 0;
      if (VALUE_TOTAL.test(context) || VALUE_TOTAL.test(above)) score += 5;
      if (VALUE_CASH.test(context)) score += 3;
      else if (VALUE_CASH.test(above)) score += 2;
      if (VALUE_BAD.test(context) || VALUE_BAD.test(above)) score -= 8; // "Economia total", parcelas…

      // Empate: vale a última ocorrência (propostas com versões revisadas no fim).
      if (!best || score >= best.score) best = { value, score };
    }
  }

  return best && best.score > 0 ? Math.round(best.value * 100) / 100 : null;
}

/* ------------------------------------------------------------------------------- */

export function parseProposalText(lines: string[]): ParsedProposal {
  const clean = lines.map((line) => line.replace(/[ \t]+/g, ' ').trim()).filter(Boolean);
  const norm = clean.map(normalize);
  return {
    clientName: findLabeledName(clean) ?? findSignatureName(clean),
    whatsapp: findWhatsapp(clean, norm),
    value: findValue(norm),
  };
}
