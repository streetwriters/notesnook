import {
  getCurrencySymbol as _getSymbol,
  ICurrencySymbols,
} from "@brixtol/currency-symbols";

export function getCurrencySymbol(currency: string) {
  return _getSymbol(currency as keyof ICurrencySymbols) || currency;
}
