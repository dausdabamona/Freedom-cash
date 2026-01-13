/**
 * Currency formatting utilities
 * Default: Indonesian Rupiah (IDR)
 */

export interface CurrencyOptions {
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format amount as Rupiah (IDR)
 */
export function formatCurrency(
  amount: number,
  options: CurrencyOptions = {}
): string {
  const {
    currency = 'IDR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format amount as compact Rupiah (K, M, B notation)
 * Example: 5000000 -> Rp5 Jt
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp${(amount / 1_000_000_000).toFixed(1)} M`; // Miliar
  } else if (amount >= 1_000_000) {
    return `Rp${(amount / 1_000_000).toFixed(1)} Jt`; // Juta
  } else if (amount >= 1_000) {
    return `Rp${(amount / 1_000).toFixed(0)} Rb`; // Ribu
  } else {
    return `Rp${amount.toFixed(0)}`;
  }
}

/**
 * Format as plain number with thousand separators (no currency symbol)
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Parse Indonesian number string to number
 * Handles both "." as thousand separator and "," as decimal
 */
export function parseIndonesianNumber(value: string): number {
  // Remove currency symbols and "Rp"
  const cleaned = value
    .replace(/Rp/g, '')
    .replace(/[^\d,.-]/g, '')
    .trim();

  // Convert Indonesian format to standard
  // In Indonesian: 1.000.000,50 (period for thousands, comma for decimal)
  // Convert to: 1000000.50
  const standardized = cleaned
    .replace(/\./g, '') // Remove thousand separators
    .replace(/,/g, '.'); // Convert decimal comma to period

  return parseFloat(standardized) || 0;
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string = 'IDR'): string {
  const symbols: { [key: string]: string } = {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    AUD: 'A$',
    CAD: 'C$',
  };
  return symbols[currency] || currency;
}

/**
 * Format large numbers with Indonesian notation
 * 1000 = 1 ribu
 * 1000000 = 1 juta
 * 1000000000 = 1 miliar
 */
export function formatIndonesianNumber(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1)} miliar`;
  } else if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)} juta`;
  } else if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(0)} ribu`;
  } else {
    return amount.toFixed(0);
  }
}
