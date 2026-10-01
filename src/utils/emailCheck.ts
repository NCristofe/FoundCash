/** Validação de e-mail no cadastro: typos comuns, domínios descartáveis e existência do domínio (MX). */

const COMMON_DOMAINS = [
  'gmail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'yahoo.com.br',
  'icloud.com',
  'uol.com.br',
  'bol.com.br',
  'terra.com.br',
  'live.com',
  'msn.com',
  'proton.me',
];

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'yopmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
  'throwawaymail.com',
]);

export type EmailCheck =
  | { status: 'ok' }
  | { status: 'invalid'; message: string }
  | { status: 'typo'; message: string; suggestion: string };

function distance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

function suggestDomain(domain: string): string | null {
  if (COMMON_DOMAINS.includes(domain)) return null;
  for (const candidate of COMMON_DOMAINS) {
    if (distance(domain, candidate) <= 2) return candidate;
  }
  return null;
}

/** `true` se o domínio recebe e-mail; `null` quando não foi possível verificar (falha aberta). */
async function domainReceivesMail(domain: string): Promise<boolean | null> {
  try {
    const response = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`, {
      signal: AbortSignal.timeout(4000),
    });
    if (!response.ok) return null;
    const result = (await response.json()) as { Status: number; Answer?: unknown[] };
    if (result.Status === 3) return false; // NXDOMAIN
    if (result.Status !== 0) return null;
    return Boolean(result.Answer?.length);
  } catch {
    return null;
  }
}

export async function checkEmail(raw: string): Promise<EmailCheck> {
  const email = raw.trim().toLowerCase();
  const domain = email.split('@')[1];
  if (!domain) return { status: 'invalid', message: 'Informe um e-mail válido.' };

  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { status: 'invalid', message: 'Use um e-mail real, não um endereço temporário.' };
  }

  const suggestion = suggestDomain(domain);
  if (suggestion) {
    return {
      status: 'typo',
      suggestion: `${email.split('@')[0]}@${suggestion}`,
      message: `Você quis dizer ${email.split('@')[0]}@${suggestion}?`,
    };
  }

  if ((await domainReceivesMail(domain)) === false) {
    return { status: 'invalid', message: `O domínio ${domain} não existe ou não recebe e-mails. Confira o endereço.` };
  }

  return { status: 'ok' };
}
