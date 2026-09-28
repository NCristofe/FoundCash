/** Utilitários de data trabalhando com datas locais no formato YYYY-MM-DD. */

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function addDaysKey(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

function parseKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Diferença em dias entre a data (YYYY-MM-DD) e hoje. Negativo = no passado. */
export function daysFromToday(key: string): number {
  const today = parseKey(todayKey());
  return Math.round((parseKey(key).getTime() - today.getTime()) / 86_400_000);
}

/** Dias inteiros desde um timestamp ISO. */
export function daysSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

/** "Hoje", "Amanhã", "Atrasado há 3 dias", "Em 5 dias". */
export function describeFollowUp(key: string): string {
  const diff = daysFromToday(key);
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Amanhã';
  if (diff === -1) return 'Atrasado há 1 dia';
  if (diff < 0) return `Atrasado há ${-diff} dias`;
  return `Em ${diff} dias`;
}

export function formatDateKey(key: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(parseKey(key));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function isInCurrentMonth(iso: string): boolean {
  const date = new Date(iso);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

export function currentMonthLabel(): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());
}

export function formatMonth(key: string): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(parseKey(key));
}
