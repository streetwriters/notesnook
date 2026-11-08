type PluralCategory = "zero" | "one" | "two" | "few" | "many" | "other";

class EnglishPluralRules {
  private type: "cardinal" | "ordinal";

  constructor(
    _locales?: string | string[],
    options?: { type?: "cardinal" | "ordinal" }
  ) {
    this.type = options?.type ?? "cardinal";
  }

  select(value: number): PluralCategory {
    if (this.type === "cardinal") return value === 1 ? "one" : "other";
    const tens = value % 100;
    const units = value % 10;
    if (units === 1 && tens !== 11) return "one";
    if (units === 2 && tens !== 12) return "two";
    if (units === 3 && tens !== 13) return "few";
    return "other";
  }

  resolvedOptions() {
    return { locale: "en", type: this.type };
  }

  static supportedLocalesOf(locales?: string | string[]) {
    return Array.isArray(locales) ? locales : locales ? [locales] : [];
  }
}

const intl = Intl as unknown as { PluralRules?: unknown };
if (!intl.PluralRules) intl.PluralRules = EnglishPluralRules;
