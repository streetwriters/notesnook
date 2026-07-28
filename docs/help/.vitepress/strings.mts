/**
 * Live UI strings, straight from the app.
 *
 * The docs quote hundreds of button and menu labels. Typing them by hand means
 * they rot the moment someone renames a string, so pages write a key instead:
 *
 *     Click on `{{archive}}`   ->   Click on `Archive`
 *
 * The key is resolved at build time from `@notesnook/intl` — the same catalogue
 * the apps render from — so renaming a string in the app updates every page that
 * quotes it on the next build. An unknown key fails the build rather than
 * shipping a placeholder.
 *
 * This only *reads* the catalogue. Never add strings to `packages/intl` for the
 * docs' sake: if a label has no string, write it as plain text and say why.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { i18n } from "@lingui/core";
import { strings, setI18nGlobal } from "@notesnook/intl";

const require = createRequire(import.meta.url);

// The compiled English catalogue lives beside the package's dist output.
const localePath = require.resolve("@notesnook/intl/locales/$en.json");
const locale = JSON.parse(readFileSync(localePath, "utf8"));
i18n.load({ en: locale.messages });
i18n.activate("en");
setI18nGlobal(i18n);

export type StringKey = keyof typeof strings;

const cache = new Map<string, string>();

/**
 * Resolve one key to the English text the app shows.
 *
 * A few catalogue entries are plural forms that take a count — quote those as
 * `{{notebooks:2}}` and the number is passed through.
 */
export function resolveString(key: string, count?: number): string {
  const cacheKey = count === undefined ? key : `${key}:${count}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  const entry = (strings as Record<string, unknown>)[key];
  if (typeof entry !== "function")
    throw new Error(
      `Unknown UI string "${key}". It must be an existing key in packages/intl ` +
        `(see strings.ts). Do not invent one — write the label as plain text instead.`
    );

  let value: unknown;
  try {
    value =
      count === undefined
        ? (entry as () => unknown)()
        : (entry as (n: number) => unknown)(count);
  } catch {
    throw new Error(
      `UI string "${key}" needs arguments. If it is a plural, quote it as ` +
        `{{${key}:2}}; otherwise write the label as plain text.`
    );
  }

  if (typeof value !== "string" || !value.trim())
    throw new Error(`UI string "${key}" did not resolve to text.`);

  cache.set(cacheKey, value);
  return value;
}

/**
 * Reverse index: rendered text -> the key(s) that produce it. Used by
 * `scripts/check-strings.mjs` to find hardcoded labels that could be keys.
 */
export function buildReverseIndex(): Map<string, string[]> {
  const index = new Map<string, string[]>();
  for (const key of Object.keys(strings)) {
    let value: unknown;
    try {
      value = (strings as Record<string, () => unknown>)[key]();
    } catch {
      continue; // needs arguments
    }
    if (typeof value !== "string" || !value.trim()) continue;
    const existing = index.get(value);
    if (existing) existing.push(key);
    else index.set(value, [key]);
  }
  return index;
}

/** Every key used across the docs this build, for reporting. */
export const usedKeys = new Set<string>();

const TOKEN = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)(?::(\d+))?\s*\}\}/g;

/**
 * markdown-it rule: swap `{{key}}` for the live string while parsing, so the
 * rendered HTML contains real text and Vue never sees a moustache.
 */
export function stringsMarkdownPlugin(md: any) {
  md.core.ruler.push("nn_ui_strings", (state: any) => {
    const where = state.env?.relativePath ? ` in ${state.env.relativePath}` : "";
    const swap = (text: string) =>
      text.replace(TOKEN, (_match: string, key: string, count?: string) => {
        try {
          const value = resolveString(key, count ? Number(count) : undefined);
          usedKeys.add(key);
          return value;
        } catch (error) {
          throw new Error((error as Error).message + where);
        }
      });

    for (const token of state.tokens) {
      if (token.type === "inline" && token.children) {
        for (const child of token.children) {
          if (child.type === "text" || child.type === "code_inline")
            child.content = swap(child.content);
        }
      } else if (token.type === "fence" || token.type === "html_block") {
        // Leave code fences alone; a doc may legitimately show `{{ }}` syntax.
        continue;
      }
      if (token.type === "inline") token.content = swap(token.content);
    }
    return true;
  });
}
