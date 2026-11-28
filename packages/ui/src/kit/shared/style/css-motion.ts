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

// CSS motion as apps/web writes it, for a platform with no stylesheet:
// `@keyframes` rules (from a `<style>` element or the `keyframes` tag) are
// kept in a registry by name, and the `animation` and `transition` shorthand
// strings are parsed into the objects the desktop kit draws.

import type { Declarations } from "./declarations";

export type KeyframeSteps = Record<string, Declarations>;

export interface ParsedAnimation {
  keyframes: KeyframeSteps;
  duration: number;
  delay?: number;
  iterationCount?: number | "infinite";
  easing?: string;
  fillMode?: string;
  direction?: string;
}

export interface ParsedTransition {
  property: string[];
  duration: number;
  delay?: number;
  easing?: string;
}

const registry = new Map<string, KeyframeSteps>();
let version = 0;

/** Changes whenever a keyframes rule is added or replaced. */
export function keyframesVersion() {
  return version;
}

export function registerKeyframes(name: string, steps: KeyframeSteps) {
  const before = registry.get(name);
  if (before && JSON.stringify(before) === JSON.stringify(steps)) return;
  registry.set(name, steps);
  version++;
}

export function getKeyframes(name: string) {
  return registry.get(name);
}

const camel = (property: string) =>
  property.trim().replace(/-([a-z])/g, (_, letter: string) =>
    letter.toUpperCase()
  );

/** `opacity: 0; transform: translateY(30px)` as a declarations object. */
export function parseDeclarations(body: string): Declarations {
  const out: Declarations = {};
  for (const part of body.split(";")) {
    const colon = part.indexOf(":");
    if (colon === -1) continue;
    const property = camel(part.slice(0, colon));
    const text = part.slice(colon + 1).trim();
    if (!property || !text) continue;
    out[property] = /^-?\d*\.?\d+$/.test(text) ? parseFloat(text) : text;
  }
  return out;
}

/** The steps of one keyframes body: `from { … } 50% { … } to { … }`. */
export function parseKeyframeSteps(body: string): KeyframeSteps {
  const steps: KeyframeSteps = {};
  const rule = /([^{}]+)\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = rule.exec(body))) {
    const declarations = parseDeclarations(match[2]);
    for (const selector of match[1].split(",")) {
      const step = selector.trim();
      if (step) steps[step] = { ...steps[step], ...declarations };
    }
  }
  return steps;
}

/**
 * Registers every `@keyframes` rule in a stylesheet text and returns their
 * names. Other rules are ignored: there is nothing on desktop they select.
 */
export function registerStylesheet(css: string): string[] {
  const names: string[] = [];
  const start = /@keyframes\s+([A-Za-z_][\w-]*)\s*\{/g;
  let match: RegExpExecArray | null;
  while ((match = start.exec(css))) {
    let depth = 1;
    let index = start.lastIndex;
    while (index < css.length && depth > 0) {
      const char = css[index++];
      if (char === "{") depth++;
      else if (char === "}") depth--;
    }
    const body = css.slice(start.lastIndex, index - 1);
    registerKeyframes(match[1], parseKeyframeSteps(body));
    names.push(match[1]);
    start.lastIndex = index;
  }
  return names;
}

let generated = 0;

/**
 * Emotion's `keyframes` tag: registers the rule and returns its name, to be
 * written into an `animation` string.
 */
export function keyframes(
  strings: TemplateStringsArray | string,
  ...values: unknown[]
): string {
  const body =
    typeof strings === "string"
      ? strings
      : strings.reduce(
          (text, part, index) =>
            text + part + (index < values.length ? String(values[index]) : ""),
          ""
        );
  const steps = parseKeyframeSteps(body);
  const fingerprint = JSON.stringify(steps);
  for (const [name, known] of registry)
    if (name.startsWith("nn-keyframes-") && JSON.stringify(known) === fingerprint)
      return name;
  const name = `nn-keyframes-${++generated}`;
  registerKeyframes(name, steps);
  return name;
}

const TIME = /^(-?\d*\.?\d+)(ms|s)$/;
const EASING =
  /^(linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end|cubic-bezier\(.*\)|steps\(.*\))$/;
const FILL = /^(none|forwards|backwards|both)$/;
const DIRECTION = /^(normal|reverse|alternate|alternate-reverse)$/;

function milliseconds(token: string) {
  const match = TIME.exec(token);
  if (!match) return undefined;
  return parseFloat(match[1]) * (match[2] === "s" ? 1000 : 1);
}

/** Splits on `separator` outside parentheses. */
function split(text: string, separator: "," | " ") {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of text) {
    if (char === "(") depth++;
    else if (char === ")") depth--;
    if (depth === 0 && (separator === " " ? /\s/.test(char) : char === ",")) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/**
 * The first animation of a CSS `animation` shorthand whose keyframes are
 * registered, or undefined (an unknown name draws nothing, as in CSS).
 */
export function parseAnimation(value: string): ParsedAnimation | undefined {
  for (const single of split(value, ",")) {
    const parsed: Partial<ParsedAnimation> = {};
    let name: string | undefined;
    let times = 0;
    for (const token of split(single, " ")) {
      const time = milliseconds(token);
      if (time !== undefined) {
        if (times++ === 0) parsed.duration = time;
        else parsed.delay = time;
      } else if (token === "infinite") parsed.iterationCount = "infinite";
      else if (/^\d*\.?\d+$/.test(token))
        parsed.iterationCount = parseFloat(token);
      else if (registry.has(token)) name = token;
      else if (EASING.test(token)) parsed.easing = token;
      else if (FILL.test(token)) parsed.fillMode = token;
      else if (DIRECTION.test(token)) parsed.direction = token;
      else if (/^(running|paused)$/.test(token)) continue;
      else name ??= token;
    }
    const steps = name ? registry.get(name) : undefined;
    if (!steps) continue;
    return { ...parsed, keyframes: steps, duration: parsed.duration ?? 0 };
  }
  return undefined;
}

const ANIMATABLE = [
  "opacity",
  "transform",
  "backgroundColor",
  "color",
  "borderColor"
];

/**
 * A CSS `transition` shorthand as the properties desktop animates. `all` is
 * every one of them; a transition of only other properties (`width`,
 * `box-shadow`) is undefined.
 */
export function parseTransition(value: string): ParsedTransition | undefined {
  const properties = new Set<string>();
  let duration: number | undefined;
  let delay: number | undefined;
  let easing: string | undefined;
  for (const single of split(value, ",")) {
    let property = "all";
    let times = 0;
    let own: number | undefined;
    for (const token of split(single, " ")) {
      const time = milliseconds(token);
      if (time !== undefined) {
        if (times++ === 0) own = time;
        else delay ??= time;
      } else if (EASING.test(token)) easing ??= token;
      else property = camel(token);
    }
    if (property === "background") property = "backgroundColor";
    const matched =
      property === "all" ? ANIMATABLE : ANIMATABLE.filter((p) => p === property);
    if (!matched.length) continue;
    matched.forEach((p) => properties.add(p));
    duration ??= own;
  }
  if (!properties.size || !duration) return undefined;
  return { property: [...properties], duration, delay, easing };
}
