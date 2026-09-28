# FoundCash — Landing page

Landing page do **FoundCash**, plataforma B2B que ajuda pequenos negócios a encontrar o dinheiro parado nos orçamentos sem resposta.

Stack: React 18 + TypeScript + Vite, CSS puro e ícones [Lucide](https://lucide.dev).

## Rodando

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # checagem de tipos + build de produção em dist/
npm run preview   # serve o build
```

## Estrutura

```text
src/
├── components/        # uma pasta por seção (componente + CSS)
│   ├── common/        # Logo, Reveal, CountUp, Badge, AreaChart, StartButton...
│   ├── AuthModal/     # cadastro/login (simulados nesta versão)
│   └── Toast/         # notificações acessíveis
├── context/           # UIProvider: abre o modal e exibe toasts
├── data/
│   ├── content.ts     # todos os textos e dados de exemplo
│   └── pricing.ts     # planos e preços (altere aqui)
├── hooks/             # useInView, useCountUp, usePrefersReducedMotion
├── pages/LandingPage/ # composição das seções
└── utils/format.ts    # formatação em R$ / pt-BR
```

## Onde mexer

- **Preços**: `src/data/pricing.ts` — `monthlyPrice`, recursos e rótulos dos botões.
- **Textos e números de exemplo**: `src/data/content.ts`.
- **Cores, tipografia e espaçamentos**: tokens em `:root` no `src/index.css`.

## Comportamentos simulados

- "Começar gratuitamente", "Entrar" e "Criar conta" abrem um modal com validação; o envio é simulado.
- "Entrar em contato" (dashboard) e "Marcar como contatado" registram o follow-up localmente e mostram uma notificação.
- "Copiar mensagem" usa a área de transferência do navegador.
- Termos de Uso / Política de Privacidade exibem um aviso de "em breve".

## Antes de publicar

- Troque `public/og-image.svg` por um PNG 1200×630 e use URLs absolutas em `og:image`/`twitter:image` (várias redes não aceitam SVG).
- Adicione `og:url` e `<link rel="canonical">` com o domínio definitivo.
