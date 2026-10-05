import { describe, expect, it } from 'vitest';
import { formatPhone, parseClientInput, parseCurrencyInput, whatsappLink } from '../utils/parsing';

describe('parseCurrencyInput', () => {
  it.each([
    ['28500', 28500],
    ['28.500', 28500],
    ['R$ 28.500,90', 28500.9],
    ['28,5 mil', 28500],
    ['28k', 28000],
    ['1.250.000', 1250000],
  ])('interpreta "%s" como %d', (input, expected) => {
    expect(parseCurrencyInput(input)).toBe(expected);
  });

  it.each(['', '   ', 'abc', '-5'])('rejeita "%s"', (input) => {
    expect(parseCurrencyInput(input)).toBeNull();
  });
});

describe('parseClientInput', () => {
  it('mantém um nome comum sem WhatsApp', () => {
    expect(parseClientInput('  Maria Silva ')).toEqual({ clientName: 'Maria Silva', whatsapp: null });
  });

  it('reconhece telefone e acrescenta o código 55', () => {
    expect(parseClientInput('(11) 98765-4321')).toEqual({
      clientName: 'WhatsApp (11) 98765-4321',
      whatsapp: '5511987654321',
    });
  });

  it('reconhece link wa.me', () => {
    expect(parseClientInput('https://wa.me/5511987654321').whatsapp).toBe('5511987654321');
  });
});

describe('formatPhone / whatsappLink', () => {
  it('formata celular e fixo', () => {
    expect(formatPhone('5511987654321')).toBe('(11) 98765-4321');
    expect(formatPhone('551132104321')).toBe('(11) 3210-4321');
  });

  it('codifica a mensagem no link', () => {
    expect(whatsappLink('5511987654321', 'Olá, tudo bem?')).toBe(
      'https://wa.me/5511987654321?text=Ol%C3%A1%2C%20tudo%20bem%3F',
    );
    expect(whatsappLink('5511987654321')).toBe('https://wa.me/5511987654321');
  });
});
