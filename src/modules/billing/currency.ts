/**
 * Conversão aproximada de preços BRL → moeda local para EXIBIÇÃO.
 * A cobrança real permanece em BRL (price IDs do Stripe cadastrados em BRL).
 *
 * As taxas são aproximadas e atualizadas manualmente. Ao exibir, mostramos
 * um aviso de que a cobrança é feita em BRL.
 */
import type { LocaleCode } from "@/i18n/config";
import { LOCALES } from "@/i18n/config";

/** Quantas unidades da moeda X custa 1 BRL (aprox., novembro/2025). */
const BRL_TO: Record<string, number> = {
  BRL: 1,
  USD: 0.18,
  EUR: 0.17,
  GBP: 0.14,
  PLN: 0.73,
  TRY: 6.9,
  SAR: 0.68,
  JPY: 27,
  KRW: 245,
  CNY: 1.3,
  TWD: 5.6,
  RUB: 17,
};

/** Regras simples de arredondamento por moeda (para preços “bonitos”). */
function prettyRound(value: number, currency: string): number {
  if (currency === "JPY" || currency === "KRW") {
    // sem centavos, arredonda para múltiplo de 100
    return Math.round(value / 100) * 100;
  }
  if (currency === "BRL") return Math.round(value);
  // outras: arredonda para .99 mais próximo
  return Math.max(1, Math.round(value)) - 0.01;
}

export function currencyForLocale(locale: LocaleCode): string {
  return LOCALES[locale]?.defaultCurrency ?? "USD";
}

export function convertBRL(amountBRL: number, targetCurrency: string): number {
  const rate = BRL_TO[targetCurrency] ?? BRL_TO.USD;
  return prettyRound(amountBRL * rate, targetCurrency);
}

export function formatMoney(amount: number, locale: LocaleCode, currency: string): string {
  const intlLocale = LOCALES[locale]?.intlLocale ?? "en-US";
  const noCents = currency === "JPY" || currency === "KRW" || (currency === "BRL" && Number.isInteger(amount));
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: noCents ? 0 : 2,
    maximumFractionDigits: noCents ? 0 : 2,
  }).format(amount);
}

/** Helper único: recebe valor em BRL e locale, devolve string formatada na moeda local + flag se é convertido. */
export function displayPriceFromBRL(
  amountBRL: number,
  locale: LocaleCode,
): { text: string; currency: string; converted: boolean } {
  const currency = currencyForLocale(locale);
  const converted = currency !== "BRL";
  const amount = converted ? convertBRL(amountBRL, currency) : amountBRL;
  return { text: formatMoney(amount, locale, currency), currency, converted };
}
