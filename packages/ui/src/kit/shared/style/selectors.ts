/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

// Nested selectors in `sx` (`"& strong": {…}`, `"th, td": {…}`,
// `".tooltip": {…}`) for a platform with no stylesheet. An element with such
// keys hands them to the kit elements below it, and each of those takes the
// styles of the rules that name its tag, class or id.
//
// What is matched: the last compound of each comma-separated selector, by tag
// (`as`, or the element's HTML tag), `.class` and `#id`; `*` matches every
// element. A descendant and a child combinator both mean "anywhere below".
// Selectors with a pseudo class or element, an attribute or a sibling
// combinator are not matched: desktop draws states with `:hover` and
// `:group-hover`.

export interface SelectorTarget {
  tag?: string;
  classes: string[];
  id?: string;
}

export interface SelectorRule {
  targets: SelectorTarget[];
  style: Record<string, unknown>;
}

export interface ElementIdentity {
  tag?: string;
  className?: string;
  id?: string;
}

const TAGS = new Set(
  (
    "a b br button code div em form h1 h2 h3 h4 h5 h6 hr i img input label li " +
    "ol option p path pre select small span strong svg table tbody td textarea " +
    "tfoot th thead tr u ul"
  ).split(" ")
);
const COMPOUND = /^(\*|[a-z][a-z0-9]*)?((?:[.#][\w-]+)*)$/i;

function parseCompound(text: string): SelectorTarget | undefined {
  const match = COMPOUND.exec(text);
  if (!match || !text) return undefined;
  const target: SelectorTarget = { classes: [] };
  if (match[1] && match[1] !== "*") target.tag = match[1].toLowerCase();
  for (const part of match[2].match(/[.#][\w-]+/g) ?? []) {
    if (part[0] === ".") target.classes.push(part.slice(1));
    else target.id = part.slice(1);
  }
  return target;
}

/**
 * The elements a nested `sx` key selects, or undefined when the key is not a
 * selector desktop matches (a state, a media query, a CSS property).
 */
export function parseSelector(key: string): SelectorTarget[] | undefined {
  if (key.startsWith("@") || /[:[+~]/.test(key)) return undefined;
  const targets: SelectorTarget[] = [];
  for (const alternative of key.split(",")) {
    const parts = alternative
      .replace(/&/g, " ")
      .replace(/>/g, " ")
      .trim()
      .split(/\s+/);
    const last = parts[parts.length - 1];
    if (!last) return undefined;
    const target = parseCompound(last);
    if (!target) return undefined;
    // A bare word is a selector only when it is an HTML tag: every other
    // nested object under a plain key is something else (a variant, a scale).
    const bare = !/[&.#*\s>]/.test(alternative.trim());
    if (bare && !(target.tag && TAGS.has(target.tag))) return undefined;
    targets.push(target);
  }
  return targets.length ? targets : undefined;
}

/** The nested selector rules of an `sx` object, in the order written. */
export function selectorRules(
  sx: Record<string, unknown>
): SelectorRule[] | undefined {
  let rules: SelectorRule[] | undefined;
  for (const key in sx) {
    const value = sx[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    // `input` is the kit's own key for the fields below an element.
    if (key === "input") continue;
    const targets = parseSelector(key);
    if (targets)
      (rules ??= []).push({ targets, style: value as Record<string, unknown> });
  }
  return rules;
}

function matches(target: SelectorTarget, element: ElementIdentity) {
  if (target.tag && target.tag !== element.tag) return false;
  if (target.id && target.id !== element.id) return false;
  if (target.classes.length) {
    const own = element.className?.split(/\s+/) ?? [];
    if (!target.classes.every((name) => own.includes(name))) return false;
  }
  return true;
}

/**
 * The styles the rules give `element`, later rules over earlier ones, or
 * undefined when none selects it.
 */
export function matchRules(
  rules: readonly SelectorRule[],
  element: ElementIdentity
): Record<string, unknown> | undefined {
  let style: Record<string, unknown> | undefined;
  for (const rule of rules)
    if (rule.targets.some((target) => matches(target, element)))
      style = { ...style, ...rule.style };
  return style;
}
