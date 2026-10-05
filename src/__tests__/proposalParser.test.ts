import { describe, expect, it } from 'vitest';
import { nameFromFileName, parseProposalText } from '../utils/proposalParser';

describe('nameFromFileName', () => {
  it('extrai o nome do cliente do arquivo', () => {
    expect(nameFromFileName('Proposta - João Silva (2).pdf')).toBe('João Silva');
  });

  it('ignora nomes genéricos', () => {
    expect(nameFromFileName('proposta_energia_solar.pdf')).toBeNull();
    expect(nameFromFileName('scan.pdf')).toBeNull();
  });
});

describe('parseProposalText', () => {
  it('lê cliente, WhatsApp e valor', () => {
    const result = parseProposalText([
      'PROPOSTA COMERCIAL',
      'Cliente: Maria Souza',
      'Celular: (11) 98765-4321',
      'Sistema fotovoltaico 6,6 kWp',
      'Investimento total: R$ 28.500,00',
    ]);
    expect(result.clientName).toBe('Maria Souza');
    expect(result.whatsapp).toBe('5511987654321');
    expect(result.value).toBe(28500);
  });

  it('não confunde o telefone da empresa com o do cliente', () => {
    const result = parseProposalText([
      'Solar Forte Ltda - CNPJ 12.345.678/0001-90',
      'Atendimento: (11) 3210-4321',
      'Cliente: Maria Souza',
      'WhatsApp: (11) 98765-4321',
    ]);
    expect(result.whatsapp).toBe('5511987654321');
  });

  it('devolve nulos quando não encontra nada', () => {
    expect(parseProposalText(['texto sem dados úteis'])).toMatchObject({ whatsapp: null, value: null });
  });
});
