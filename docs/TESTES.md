# Testes do FoundCash

Última execução: **32 testes em 4 arquivos, todos passando** (Vitest 2.1.9, ~2 s).

## Como rodar

```bash
npm test                      # roda tudo uma vez
npx vitest                    # modo observação (re-roda ao salvar)
npx vitest run parsing        # só os arquivos cujo nome contém "parsing"
```

Os testes ficam em `src/__tests__/` e cobrem a **lógica pura** (sem tela, sem banco, sem rede real).

## O que está coberto

### `parsing.test.ts` (15 testes): entrada de dados na Entrada Rápida
| Função | O que garante |
| --- | --- |
| `parseCurrencyInput` | `28500`, `28.500`, `R$ 28.500,90`, `28,5 mil`, `28k` e `1.250.000` viram o número certo; vazio, texto e negativo retornam `null` |
| `parseClientInput` | nome comum fica sem WhatsApp; telefone `(11) 98765-4321` vira `5511987654321`; link `wa.me/...` é reconhecido |
| `formatPhone` | formata celular (9 dígitos) e fixo (8 dígitos) |
| `whatsappLink` | monta o link e codifica a mensagem (acentos, vírgula, `?`) |

### `emailCheck.test.ts` (9 testes): validação de e-mail no cadastro
A consulta de DNS é simulada, então o teste não depende de internet.

| Caso | Resultado esperado |
| --- | --- |
| Domínio descartável (`mailinator.com`) | `invalid`, sem consultar o DNS |
| `joao@gmial.com` | `typo`, sugerindo `joao@gmail.com` |
| `joao@gmail.com` | `ok` |
| Domínio inexistente (NXDOMAIN) | `invalid` |
| Domínio sem registro MX | `invalid` |
| Domínio com MX | `ok` |
| DNS fora do ar (erro de rede) | `ok` (falha aberta, não bloqueia o cadastro) |
| DNS devolve erro HTTP | `ok` (falha aberta) |
| Texto sem `@` | `invalid` |

### `proposalParser.test.ts` (5 testes): importação de proposta em PDF
- Nome do cliente tirado do nome do arquivo (`Proposta - João Silva (2).pdf` → `João Silva`).
- Nomes genéricos (`proposta_energia_solar.pdf`, `scan.pdf`) são ignorados.
- Texto de proposta completo: cliente, WhatsApp e valor (`R$ 28.500,00`) são extraídos.
- O telefone de atendimento da empresa não é confundido com o do cliente.
- Texto sem dados úteis devolve `null` em vez de inventar valores.

### `metrics.test.ts` (3 testes): números do painel
- Lista só as oportunidades abertas.
- Soma o dinheiro em propostas abertas e conta quantas são.
- "Recuperado no mês" soma só o que fechou **neste mês**; vendas fechadas em outros meses ficam de fora.

## O que NÃO está coberto (e por quê)

| Área | Situação |
| --- | --- |
| Cadastro, login e confirmação por e-mail | Dependem do Supabase real. Testar manualmente (ver abaixo) |
| Salvar oportunidades, RLS e migrations | Idem: precisam de um banco de verdade |
| Importar PDF de verdade (pdf.js) | Só o parser de texto é testado, não a leitura do arquivo |
| Edge Functions (`extract-proposal`, `monthly-report`) | Rodam em Deno, fora do Vitest |
| Radar (`radar.ts`: prioridades, sinais, insights) | **Sem testes ainda**; é a próxima prioridade |
| Telas e visual | Sem testes automatizados de interface |

## Roteiro de teste manual (depende do backend no ar)

1. **Cadastro:** criar conta com e-mail real → chega o e-mail de confirmação → o link abre `/app/boas-vindas`.
2. **E-mail inválido:** tentar `x@gmial.com` (deve sugerir correção) e `x@dominioinexistente-xyz.com` (deve barrar).
3. **E-mail repetido:** cadastrar de novo o mesmo e-mail → aparece "Já existe uma conta com este e-mail".
4. **Login e recuperação de senha:** entrar, sair, pedir link de nova senha.
5. **Entrada Rápida:** cadastrar uma oportunidade com nome, valor e follow-up; aparece no painel.
6. **Importar PDF:** subir uma proposta real; conferir cliente, WhatsApp e valor preenchidos.
7. **Fluxo de venda:** abrir a oportunidade, registrar contato, marcar "Fechou" → o valor entra em "Fechado no mês".
8. **Limite do plano Essencial:** passar do limite de oportunidades abertas → mensagem de limite.

## Como adicionar um teste

Crie `src/__tests__/<nome>.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { minhaFuncao } from '../utils/minhaFuncao';

describe('minhaFuncao', () => {
  it('faz X quando Y', () => {
    expect(minhaFuncao('entrada')).toBe('saida');
  });
});
```
