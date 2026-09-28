const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export type NumberFormat = 'currency' | 'number' | 'percent';

export function formatCurrency(value: number): string {
  return currencyFormatter.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

export function formatPercent(value: number): string {
  return `${percentFormatter.format(value)}%`;
}

export function formatValue(value: number, format: NumberFormat): string {
  if (format === 'currency') return formatCurrency(value);
  if (format === 'percent') return formatPercent(value);
  return formatNumber(value);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
