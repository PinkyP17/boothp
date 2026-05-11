export const QUICK_PICK_CURRENCIES = [
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "IDR", symbol: "Rp", name: "Indonesian Rupiah" },
];

export const ALL_CURRENCIES = [
  ...QUICK_PICK_CURRENCIES,
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "THB", symbol: "฿", name: "Thai Baht" },
  { code: "PHP", symbol: "₱", name: "Philippine Peso" },
  { code: "TWD", symbol: "NT$", name: "New Taiwan Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "VND", symbol: "₫", name: "Vietnamese Dong" },
  { code: "BND", symbol: "B$", name: "Brunei Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
];

export const DEFAULT_CURRENCY = "MYR";

export function getCurrencySymbol(code) {
  const currency = ALL_CURRENCIES.find((c) => c.code === code);
  return currency ? currency.symbol : code + " ";
}
