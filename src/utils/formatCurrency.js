import { getCurrencySymbol } from "../constants/currencies";

export function formatCurrency(amount, currencyCode) {
  const symbol = getCurrencySymbol(currencyCode || "MYR");
  return `${symbol}${amount.toFixed(2)}`;
}
