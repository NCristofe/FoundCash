/**
 * Interpreta o campo "Cliente" da Entrada Rápida: aceita um nome, um número
 * de telefone ou um link do WhatsApp (wa.me / api.whatsapp.com).
 */
export function parseClientInput(raw: string): { clientName: string; whatsapp: string | null } {
  const input = raw.trim();
  const linkMatch = input.match(/(?:wa\.me\/|phone=)(\+?\d[\d\s-]{8,})/i);
  const phoneCandidate = linkMatch ? linkMatch[1] : input;
  const digits = phoneCandidate.replace(/\D/g, '');
  const looksLikePhone = /^[+\d\s().-]+$/.test(phoneCandidate) && digits.length >= 10 && digits.length <= 13;

  if (linkMatch || looksLikePhone) {
    const whatsapp = digits.length <= 11 ? `55${digits}` : digits;
    return { clientName: `WhatsApp ${formatPhone(whatsapp)}`, whatsapp };
  }

  return { clientName: input, whatsapp: null };
}

/** 5511987654321 → (11) 98765-4321 */
export function formatPhone(digits: string): string {
  const local = digits.startsWith('55') && digits.length >= 12 ? digits.slice(2) : digits;
  const ddd = local.slice(0, 2);
  const number = local.slice(2);
  if (number.length === 9) return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5)}`;
  if (number.length === 8) return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  return digits;
}

/**
 * Converte o valor digitado em reais: "28.500", "28500", "R$ 28.500,90", "28,5 mil", "28k".
 * Retorna null quando não for um número válido.
 */
export function parseCurrencyInput(raw: string): number | null {
  let text = raw.trim().toLowerCase().replace(/r\$\s?/g, '').replace(/\s/g, '');
  if (!text) return null;

  let multiplier = 1;
  if (/(mil|k)$/.test(text)) {
    multiplier = 1000;
    text = text.replace(/(mil|k)$/, '');
  }

  // Formato brasileiro: ponto = milhar, vírgula = decimal.
  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.');
  } else if (/^\d{1,3}(\.\d{3})+$/.test(text)) {
    text = text.replace(/\./g, '');
  }

  const value = Number(text) * multiplier;
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

export function whatsappLink(phone: string, message?: string): string {
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${phone}${query}`;
}
