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

import { css } from "@theme-ui/css";
import type { SxProp } from "../../../../ui";
import type { ThemeContextValue } from "../theme";
import type { Declarations } from "../../../../shared/style/declarations";
import { lineHeightRatio } from "../../../../shared/style/line-height";
import { normalizeVariant } from "../../../../shared/style/variants";

const UNITLESS = new Set([
  "opacity",
  "zIndex",
  "flex",
  "flexGrow",
  "flexShrink",
  "fontWeight",
  "aspectRatio",
  "order"
]);

const GROUP_STATES: Record<string, string> = {
  ":group-hover": ":hover",
  ":group-active": ":active"
};

const EASINGS = new Set([
  "linear",
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out"
]);

const BACKGROUND_ALIASES: Record<string, string> = {
  experimental_backgroundImage: "backgroundImage",
  experimental_backgroundSize: "backgroundSize",
  experimental_backgroundPosition: "backgroundPosition"
};

function kebab(name: string) {
  if (name.startsWith("--")) return name;
  const result = name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
  return /^(webkit|moz|ms)-/.test(result) ? `-${result}` : result;
}

function transformToCss(parts: Record<string, number | string>[]) {
  return parts
    .flatMap((part) =>
      Object.entries(part).map(([name, value]) =>
        typeof value === "number"
          ? name.startsWith("scale")
            ? `${name}(${value})`
            : name === "rotate"
            ? `${name}(${value}deg)`
            : `${name}(${value}px)`
          : `${name}(${value})`
      )
    )
    .join(" ");
}

function formatValue(
  key: string,
  value: unknown,
  colors: Record<string, string>
): string {
  if (typeof value === "number" && key === "lineHeight")
    return lineHeightRatio(value) !== undefined ? String(value) : `${value}px`;
  if (typeof value === "number")
    return UNITLESS.has(key) || value === 0 ? String(value) : `${value}px`;
  if (Array.isArray(value)) return value.join(" ");
  if (typeof value !== "string") return String(value);
  if (/^border(Top|Right|Bottom|Left)?$|^outline$/.test(key)) {
    const parts = value.split(" ");
    const last = parts[parts.length - 1];
    if (parts.length > 1 && colors[last]) parts[parts.length - 1] = colors[last];
    return parts.join(" ");
  }
  return value;
}

function declarationsToCss(
  declarations: Declarations,
  colors: Record<string, string>
) {
  let out = "";
  for (const rawKey in declarations) {
    const value = declarations[rawKey];
    if (value === undefined || value === null) continue;
    const key = BACKGROUND_ALIASES[rawKey] ?? rawKey;
    if (key === "numberOfLines") continue;
    if (key === "transform" && Array.isArray(value)) {
      out += `transform:${transformToCss(value as never)};`;
      continue;
    }
    if (key === "transition" || key === "animation") continue;
    out += `${kebab(key)}:${formatValue(key, value, colors)};`;
  }
  return out;
}

interface TransitionInput {
  property: string | string[];
  duration: number;
  delay?: number;
  easing?: string;
}

interface AnimationInput {
  keyframes: Record<string, Declarations>;
  duration: number;
  delay?: number;
  iterationCount?: number | "infinite";
  easing?: string;
}

function transitionToCss(input: TransitionInput) {
  const property = Array.isArray(input.property)
    ? input.property.map(kebab).join(",")
    : kebab(input.property);
  const easing = EASINGS.has(input.easing ?? "") ? input.easing : "ease";
  return `transition-property:${property};transition-duration:${
    input.duration
  }ms;transition-delay:${input.delay ?? 0}ms;transition-timing-function:${easing};`;
}

let animationCounter = 0;
const animationNames = new Map<string, string>();
const globalRules: string[] = [];

function animationToCss(
  input: AnimationInput,
  theme: ThemeContextValue["theme"]
) {
  const frames = Object.entries(input.keyframes)
    .map(([step, frame]) => {
      const themed = css({
        ...frame,
        ...(frame.bg ? { backgroundColor: frame.bg } : {})
      } as never)(theme as never) as Declarations;
      delete themed.bg;
      return `${step}{${declarationsToCss(themed, {})}}`;
    })
    .join("");
  let name = animationNames.get(frames);
  if (!name) {
    name = `nn-anim-${animationCounter++}`;
    animationNames.set(frames, name);
    globalRules.push(`@keyframes ${name}{${frames}}`);
  }
  const easing = EASINGS.has(input.easing ?? "") ? input.easing : "ease";
  return {
    css: `animation:${name} ${input.duration}ms ${easing} ${
      input.delay ?? 0
    }ms ${input.iterationCount ?? 1};`,
    rules: [`@keyframes ${name}{${frames}}`]
  };
}

export interface ResolveOptions {
  variantGroup?: "variants" | "text" | "buttons" | "forms";
  variant?: string;
}

export interface ResolvedClass {
  className: string;
  groupClassNames: string[];
}

const sheet: { element?: HTMLStyleElement } = {};
const injected = new Set<string>();

function ensureSheet() {
  if (sheet.element) return sheet.element;
  const element = document.createElement("style");
  element.setAttribute("data-nn-styles", "");
  document.head.appendChild(element);
  sheet.element = element;
  return element;
}

function inject(rule: string) {
  if (injected.has(rule)) return;
  injected.add(rule);
  ensureSheet().appendChild(document.createTextNode(rule));
}

function hash(text: string) {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = (h * 33) ^ text.charCodeAt(i);
  return (h >>> 0).toString(36);
}

function ruleFor(selector: string, body: string, wrapper?: string) {
  if (!body) return "";
  const rule = `${selector}{${body}}`;
  return wrapper ? `${wrapper}{${rule}}` : rule;
}

function compile(
  className: string,
  sx: SxProp,
  context: ThemeContextValue,
  options: ResolveOptions
) {
  const { theme, colors } = context;
  const variantStyles =
    options.variantGroup && options.variant
      ? (theme[options.variantGroup] as Record<string, Declarations>)[
          options.variant
        ]
      : undefined;

  const own: Declarations = {};
  let transition: TransitionInput | undefined;
  let animation: AnimationInput | undefined;
  const groups: { name: string; state: string; style: Declarations }[] = [];
  const merged = { ...normalizeVariant(variantStyles, colors) } as Declarations;
  for (const key in sx as Declarations) {
    const value = (sx as Declarations)[key];
    if (key in GROUP_STATES) {
      const entry = value as { group: string; style: Declarations };
      groups.push({
        name: entry.group,
        state: GROUP_STATES[key],
        style: entry.style
      });
    } else if (key === "transition") transition = value as TransitionInput;
    else if (key === "animation") animation = value as AnimationInput;
    else merged[key] = value;
  }
  Object.assign(own, merged);

  const themed = css(own as never)(theme as never) as Declarations;
  const base: Declarations = {};
  const nested: [string, Declarations][] = [];
  const media: [string, Declarations][] = [];
  for (const key in themed) {
    const value = themed[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (key.startsWith("@media")) media.push([key, value as Declarations]);
      else nested.push([key, value as Declarations]);
    } else base[key] = value;
  }

  const selector = `.${className}`;
  let text = ruleFor(selector, declarationsToCss(base, colors));
  if (transition) text += ruleFor(selector, transitionToCss(transition));
  if (animation) {
    const result = animationToCss(animation, theme);
    result.rules.forEach(inject);
    text += ruleFor(selector, result.css);
  }
  for (const [key, value] of nested) {
    const state = key.replace(/^&/, "");
    const suffix =
      state === ":drag-over" ? "[data-drag-over]" : state.startsWith(":") ? state : ` ${state}`;
    text += ruleFor(
      `${selector}${suffix}`,
      declarationsToCss(css(value as never)(theme as never) as Declarations, colors)
    );
  }
  for (const [query, value] of media) {
    const inner: Declarations = {};
    for (const key in value) inner[key] = value[key];
    text += ruleFor(selector, declarationsToCss(inner, colors), query);
  }
  for (const group of groups) {
    const themedGroup = css(group.style as never)(theme as never) as Declarations;
    text += ruleFor(
      `.nn-group-${group.name}${group.state} ${selector}`,
      declarationsToCss(themedGroup, colors)
    );
  }
  return text;
}

const classCache = new WeakMap<
  object,
  WeakMap<object, Map<string, string>>
>();
const fingerprintCache = new WeakMap<object, Map<string, string>>();
const EMPTY: SxProp = {};

export function resolveClassName(
  sx: SxProp | undefined,
  context: ThemeContextValue,
  options: ResolveOptions
): string {
  const target = sx ?? EMPTY;
  const optionsKey = `${options.variantGroup ?? ""}/${options.variant ?? ""}`;
  let byObject = classCache.get(context.key);
  if (!byObject) classCache.set(context.key, (byObject = new WeakMap()));
  let byOptions = byObject.get(target);
  if (!byOptions) byObject.set(target, (byOptions = new Map()));
  const hit = byOptions.get(optionsKey);
  if (hit !== undefined) return hit;

  let byFingerprint = fingerprintCache.get(context.key);
  if (!byFingerprint)
    fingerprintCache.set(context.key, (byFingerprint = new Map()));
  const fingerprint = `${optionsKey}\u0000${JSON.stringify(target)}`;
  let className = byFingerprint.get(fingerprint);
  if (className === undefined) {
    const probe = compile("nn-x", target, context, options);
    className = probe ? `nn-${hash(probe)}` : "";
    if (className) {
      inject(probe.split(".nn-x").join(`.${className}`));
    }
    byFingerprint.set(fingerprint, className);
  }
  byOptions.set(optionsKey, className);
  return className;
}

export function injectBaseStyles() {
  inject(
    `*,*::before,*::after{box-sizing:border-box}*{outline:none}html,body,#root{height:100%;margin:0;padding:0}body{overflow:hidden}`
  );
  inject(
    `.nn-box{display:flex;flex-direction:column;position:relative;min-width:0;min-height:0;flex-shrink:1;align-items:stretch;align-content:flex-start}`
  );
  inject(`.nn-box[data-display-none]{display:none}`);
  inject(`.nn-text{display:block;margin:0;user-select:none;white-space:pre-wrap}.nn-text[data-selectable]{user-select:text}`);
  inject(
    `.nn-lines{display:-webkit-box;-webkit-box-orient:vertical;overflow:hidden;white-space:normal}`
  );
  inject(
    `.nn-button{display:flex;flex-direction:row;align-items:center;justify-content:center;cursor:pointer;border:0;padding:0;margin:0;font:inherit;color:inherit;background:none;flex-shrink:0}.nn-button:disabled{cursor:not-allowed;opacity:.5}`
  );
  inject(
    `.nn-input{font:inherit;margin:0;min-width:0;outline:none;border:0;background:transparent;color:inherit}.nn-input::placeholder{opacity:.6}`
  );
  inject(`.nn-textarea{resize:none;flex-shrink:0}`);
  inject(`.nn-icon svg{display:block;flex-shrink:0;max-width:none}`);
  inject(`.nn-icon>div{display:flex;flex-shrink:0}`);
  inject(`.nn-icon>div>svg{width:100%;height:100%}`);
  inject(`.nn-scroll{overflow:auto}`);
  inject(
    `*{scrollbar-width:thin;scrollbar-color:var(--nn-scrollbar,rgba(128,128,128,.4)) transparent}`
  );
  globalRules.forEach(inject);
}
