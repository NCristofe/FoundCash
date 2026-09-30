# FoundCash

Plataforma B2B que ajuda **integradores de energia solar** a encontrar o dinheiro parado nas propostas sem resposta.

**Métrica principal: Valor Recuperado** — soma das propostas marcadas como "Fechou negócio" no mês. Painel, relatório mensal e ROI giram em torno dela.

Stack: React 18 + TypeScript + Vite (CSS puro, ícones Lucide) · Supabase (Postgres, Auth, RLS, Edge Functions, pg_cron) · Resend (e-mail).

## O que está implementado (MVP)

| Item | Onde |
| --- | --- |
| Entrada Rápida: cliente (nome ou link/número do WhatsApp), valor, follow-up com atalhos (amanhã, 3 dias, 1 semana). Atalho **N** em qualquer tela. | `src/app/components/QuickEntryForm.tsx` |
| Importar proposta em PDF: lê o texto no navegador (pdf.js) e preenche cliente, WhatsApp e valor por regras, sem IA nem serviço externo | `src/utils/proposalParser.ts`, `src/app/services/readProposalPdf.ts` |
| Painel: contador de dinheiro em propostas ativas, "Recuperado no mês" com ROI vs. assinatura, **Prioridade de hoje** (top 3 por valor ou atraso) | `src/app/pages/DashboardPage.tsx` |
| Follow-up: abrir WhatsApp com script preenchido, registrar contato, fechou/perdeu (com motivo), histórico | `src/app/components/OpportunityDialog.tsx` |
| Relatório mensal de ROI por e-mail no dia 1º ("Neste mês, você recuperou R$ X…") + página de relatório | `supabase/functions/monthly-report`, `src/app/pages/ReportPage.tsx` |
| Onboarding das 5 primeiras propostas + link para sessão de ajuda | `src/app/pages/OnboardingPage.tsx` |
| Planos Essencial (R$ 119 / R$ 99 anual) e Pro (R$ 199 / R$ 169 anual), teste de 14 dias | `supabase/functions/_shared/plans.ts` |
| Pro: scripts personalizáveis e relatório de perdas | `src/app/pages/ScriptsPage.tsx`, `LossesPage.tsx` |
| Landing adaptada ao nicho solar, calculadora de ROI e seção "Em breve" | `src/components/` |

**Roadmap (não implementado):** cadastro por áudio (transcrição) e alertas de propostas "esfriando".

**Não implementado ainda:** cobrança (gateway de pagamento). Hoje o usuário escolhe o plano nas configurações e o teste de 14 dias não bloqueia o uso ao terminar.

## Configuração

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Rode as migrações, em ordem, no **SQL Editor** (ou `supabase db push` com a CLI): `20260928000000_init.sql`, `20260929000000_proposal_links.sql` e `20260930000000_pipeline_radar.sql` (etapas do pipeline e dados do projeto solar; o app não salva oportunidades sem ela).
3. Em **Authentication → URL Configuration**, defina o *Site URL* (ex.: `http://localhost:5173` em dev) e adicione em *Redirect URLs*:
   - `http://localhost:5173/app/boas-vindas`
   - `http://localhost:5173/redefinir-senha`
   - (e os equivalentes do domínio de produção)
4. Copie `.env.example` para `.env.local` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (Project Settings → API).

### 2. Relatório mensal (Edge Function + Resend)

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase secrets set CRON_SECRET=<um-segredo-longo> RESEND_API_KEY=<chave> \
  REPORT_FROM_EMAIL="FoundCash <relatorio@seudominio.com.br>" APP_URL=https://seu-dominio
npx supabase functions deploy monthly-report --no-verify-jwt
```

Depois rode `supabase/cron.sql` no SQL Editor (substituindo `<PROJECT_REF>` e `<CRON_SECRET>`). O envio acontece todo dia 1º às 08:00 (Brasília).

Teste sem enviar e-mails:

```bash
curl -X POST https://<PROJECT_REF>.supabase.co/functions/v1/monthly-report \
  -H "Authorization: Bearer <CRON_SECRET>" -H "Content-Type: application/json" \
  -d '{"month":"2026-09","dryRun":true}'
```

### 3. (Opcional, desligado) Leitura de propostas com IA

A importação de PDF funciona sem configuração: roda no navegador, por regras. Não funciona com PDF escaneado (imagem).

Para mais precisão no futuro, `supabase/functions/extract-proposal` lê o PDF com o Claude. Ela **não é chamada pelo app hoje**. Para ativar, crie uma chave em [console.anthropic.com](https://console.anthropic.com), rode o deploy abaixo e troque `readProposalPdf` por uma chamada à função em `QuickEntryForm.tsx`.

```bash
npx supabase secrets set ANTHROPIC_API_KEY=<chave>
npx supabase functions deploy extract-proposal --no-verify-jwt
```

### 4. Rodando

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # checagem de tipos + build de produção
```

Sem `.env.local`, a landing funciona normalmente e as páginas do app mostram um aviso de configuração.

## Rotas

| Rota | Página |
| --- | --- |
| `/` | Landing |
| `/cadastro?plano=essencial&ciclo=monthly`, `/entrar`, `/recuperar-senha`, `/redefinir-senha` | Autenticação |
| `/app` | Painel |
| `/app/boas-vindas` | Onboarding |
| `/app/relatorio`, `/app/scripts`, `/app/perdas`, `/app/configuracoes` | App |

Em produção, configure o host para servir `index.html` em qualquer rota (SPA fallback).

## Onde mexer

- **Preços e limite do Essencial**: `supabase/functions/_shared/plans.ts` (fonte única para landing, app e relatório). Se mudar o limite de 50 propostas abertas, altere também `essencial_open_limit()` no SQL.
- **Nicho (textos, scripts padrão, motivos de perda)**: `src/config/niche.ts`.
- **Conteúdo da landing**: `src/data/content.ts`.
- **Onboarding / atalhos de data / sessão de ajuda**: `src/config/app.ts` e `VITE_HELP_SESSION_URL`.

## Segurança

- Todas as tabelas usam Row Level Security: cada usuário só vê e altera os próprios dados.
- O usuário não consegue alterar `trial_ends_at` (permissão por coluna).
- Scripts personalizados só podem ser criados/editados no plano Pro (política no banco).
- O histórico (`opportunity_events`) é escrito apenas por trigger.
- A Edge Function do relatório exige `Authorization: Bearer <CRON_SECRET>`.

## Antes de publicar

- Troque `public/og-image.svg` por um PNG 1200×630 e use URLs absolutas em `og:image`/`twitter:image`.
- Adicione `og:url` e `<link rel="canonical">` com o domínio definitivo.
- Apague a pasta `src/components/AuthModal/` (substituída pelas páginas de autenticação).
