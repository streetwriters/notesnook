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
import type { SxProp } from "../../contracts";
import type { ThemeContextValue } from "../../shared/theme";
import {
  convertAnimation,
  convertDeclarations,
  convertStateDeclarations,
  convertTransition,
  type AnimationInput,
  type Declarations,
  type TransitionInput
} from "./convert";
import { normalizeVariant } from "../../shared/style/variants";

export interface ResolvedStyle {
  style: Record<string, unknown>;
  animated?: boolean;
  numberOfLines?: number;
  selectable?: boolean;
  objectFit?: "cover" | "contain" | "fill";
  hoverStyle?: Record<string, unknown>;
  activeStyle?: Record<string, unknown>;
  focusStyle?: Record<string, unknown>;
  focusVisibleStyle?: Record<string, unknown>;
  dragOverStyle?: Record<string, unknown>;
  groupHoverStyle?: { group: string; style: Record<string, unknown> };
  groupActiveStyle?: { group: string; style: Record<string, unknown> };
}

type VariantGroup = "variants" | "text" | "buttons" | "forms";

export interface ResolveOptions {
  variantGroup?: VariantGroup;
  variant?: string;
  breakpoint: number;
}

const BREAKPOINT_QUERY = /min-width:\s*(\d+(?:\.\d+)?)px/;
const STATE_KEYS = {
  ":hover": "hoverStyle",
  ":active": "activeStyle",
  ":focus": "focusStyle",
  ":focus-visible": "focusVisibleStyle",
  ":drag-over": "dragOverStyle"
} as const;

export function breakpointOf(width: number, breakpoints: string[]) {
  let index = 0;
  for (const breakpoint of breakpoints)
    if (width >= parseFloat(breakpoint)) index++;
  return index;
}

const identityCache = new WeakMap<
  object,
  WeakMap<object, Map<string, ResolvedStyle>>
>();
const fingerprintCache = new WeakMap<object, Map<string, ResolvedStyle>>();

function optionsKey(options: ResolveOptions) {
  return `${options.variantGroup ?? ""}/${options.variant ?? ""}/${
    options.breakpoint
  }`;
}

type TransformPart = Record<string, number | string>;

function transformToCss(parts: TransformPart[]) {
  return parts
    .flatMap((part) =>
      Object.entries(part).map(([name, value]) =>
        typeof value === "number"
          ? name.startsWith("scale")
            ? `${name}(${value})`
            : `${name}(${value}px)`
          : `${name}(${value})`
      )
    )
    .join(" ");
}

function withCssTransform<T extends object>(style: T): T {
  const transform = (style as { transform?: unknown }).transform;
  if (
    Array.isArray(transform) &&
    transform.length > 0 &&
    typeof transform[0] === "object"
  )
    return {
      ...style,
      transform: transformToCss(transform as TransformPart[])
    };
  return style;
}

/** `:disabled` styles apply while the element's `disabled` prop is set. */
export function withDisabledStyle(sx: SxProp | undefined, disabled: unknown) {
  const state = (sx as { ":disabled"?: SxProp } | undefined)?.[":disabled"];
  if (!state) return sx;
  const rest: Record<string, unknown> = { ...sx };
  delete rest[":disabled"];
  return (disabled ? { ...rest, ...state } : rest) as SxProp;
}

export function resolveSx(
  sx: SxProp | undefined,
  context: ThemeContextValue,
  options: ResolveOptions
): ResolvedStyle {
  const target = sx ?? EMPTY;
  const key = optionsKey(options);

  let byObject = identityCache.get(context.key);
  if (!byObject) identityCache.set(context.key, (byObject = new WeakMap()));
  let byOptions = byObject.get(target);
  if (!byOptions) byObject.set(target, (byOptions = new Map()));
  const identityHit = byOptions.get(key);
  if (identityHit) return identityHit;

  let byFingerprint = fingerprintCache.get(context.key);
  if (!byFingerprint)
    fingerprintCache.set(context.key, (byFingerprint = new Map()));
  const fingerprint = `${key}\u0000${JSON.stringify(target)}`;
  let resolved = byFingerprint.get(fingerprint);
  if (!resolved) {
    resolved = compute(target, context, options);
    byFingerprint.set(fingerprint, resolved);
  }
  byOptions.set(key, resolved);
  return resolved;
}

const EMPTY: SxProp = {};

const ALPHA = /^alpha\((.+),\s*(-?\d*\.?\d+)\)$/;
// CSS colour names apps/web passes to alpha(), so their opacity can be set.
const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  gray: "#808080",
  grey: "#808080"
};
const CSS_VAR = /var\(--([A-Za-z0-9-]+)\)/g;

/** `var(--token)` (as apps/web writes colours) replaced by the token's colour. */
export function resolveCssVars(value: string, colors: Record<string, string>) {
  return value.replace(CSS_VAR, (whole, token: string) => colors[token] ?? whole);
}
const HEX_COLOR = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** The value `alpha()` from the kit's hooks returns for `color` at `amount`. */
export function alphaToken(color: string, amount: number) {
  return `alpha(${color}, ${amount})`;
}

/** `color` with its opacity multiplied by `amount`, as `#rrggbbaa`. */
export function withAlpha(color: string, amount: number) {
  const match = HEX_COLOR.exec(color.trim());
  if (!match) return color;
  let hex = match[1];
  if (hex.length <= 4)
    hex = hex
      .split("")
      .map((digit) => digit + digit)
      .join("");
  const base = hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1;
  const opacity = Math.round(Math.max(0, Math.min(1, base * amount)) * 255);
  return `#${hex.slice(0, 6)}${opacity.toString(16).padStart(2, "0")}`;
}

/** The colour of a theme token, an `alpha()` value or a literal. */
export function resolveColor(value: string, colors: Record<string, string>) {
  if (value.includes("var(--")) return resolveCssVars(value, colors);
  const match = value.startsWith("alpha(") ? ALPHA.exec(value) : null;
  if (!match) return colors[value] ?? value;
  const color = match[1].trim();
  return withAlpha(
    colors[color] ?? NAMED_COLORS[color] ?? color,
    parseFloat(match[2])
  );
}

/**
 * Replaces every `alpha()` value, and every `var(--token)` in a value, in
 * `declarations` with its colour.
 */
export function resolveAlpha<T extends object>(
  declarations: T,
  colors: Record<string, string>
): T {
  let result: Record<string, unknown> | undefined;
  for (const key in declarations) {
    const value = (declarations as Record<string, unknown>)[key];
    let next = value;
    if (typeof value === "string") {
      if (value.startsWith("alpha(")) next = resolveColor(value, colors);
      else if (value.includes("var(--")) next = resolveCssVars(value, colors);
    } else if (value && typeof value === "object" && !Array.isArray(value))
      next = resolveAlpha(value, colors);
    if (next !== value)
      (result ??= { ...(declarations as Record<string, unknown>) })[key] = next;
  }
  return (result as T | undefined) ?? declarations;
}

function groupEntries(sx: SxProp) {
  const own: Record<string, unknown> = {};
  let groupHover: { group: string; style: Declarations } | undefined;
  let groupActive: { group: string; style: Declarations } | undefined;
  let transition: TransitionInput | undefined;
  let animation: AnimationInput | undefined;
  for (const key in sx) {
    const value = (sx as Record<string, unknown>)[key];
    if (key === ":group-hover") groupHover = value as typeof groupHover;
    else if (key === ":group-active") groupActive = value as typeof groupActive;
    else if (key === "transition") transition = value as TransitionInput;
    else if (key === "animation") animation = value as AnimationInput;
    else own[key] = value;
  }
  return { own, groupHover, groupActive, transition, animation };
}

function compute(
  sx: SxProp,
  context: ThemeContextValue,
  options: ResolveOptions
): ResolvedStyle {
  const { theme, colors } = context;
  const variants =
    options.variantGroup && options.variant
      ? (theme[options.variantGroup] as Record<string, Declarations>)[
          options.variant
        ]
      : undefined;
  const { own, groupHover, groupActive, transition, animation } =
    groupEntries(sx);
  const merged = resolveAlpha(
    { ...normalizeVariant(variants, colors), ...own },
    colors
  );
  const themed = css(withCssTransform(merged) as never)(
    theme as never
  ) as Declarations;

  const base: Declarations = {};
  const states: Partial<Record<keyof typeof STATE_KEYS, Declarations>> = {};
  const media: [number, Declarations][] = [];
  for (const key in themed) {
    const value = themed[key];
    if (key in STATE_KEYS) {
      states[key as keyof typeof STATE_KEYS] = value as Declarations;
    } else if (key.startsWith("@media")) {
      const match = BREAKPOINT_QUERY.exec(key);
      if (match) media.push([parseFloat(match[1]), value as Declarations]);
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      continue;
    } else base[key] = value;
  }
  for (const [minWidth, declarations] of media.sort((a, b) => a[0] - b[0])) {
    if (options.breakpoint === 0) continue;
    const limit = parseFloat(theme.breakpoints[options.breakpoint - 1] ?? "0");
    if (minWidth <= limit) Object.assign(base, declarations);
  }

  const converted = convertDeclarations(base);
  if (transition) Object.assign(converted.style, convertTransition(transition));
  if (animation)
    Object.assign(
      converted.style,
      convertAnimation(
        animation,
        (frame) =>
          css(withCssTransform(frame) as never)(theme as never) as Declarations
      )
    );
  const resolved: ResolvedStyle = {
    style: converted.style,
    animated: transition || animation ? true : undefined,
    numberOfLines: converted.numberOfLines,
    selectable: converted.selectable,
    objectFit: converted.objectFit as ResolvedStyle["objectFit"]
  };
  for (const state in states) {
    resolved[STATE_KEYS[state as keyof typeof STATE_KEYS]] =
      convertStateDeclarations(states[state as keyof typeof STATE_KEYS]!);
  }
  const resolveGroup = (entry: { group: string; style: Declarations }) => ({
    group: entry.group,
    style: convertStateDeclarations(
      css(withCssTransform(resolveAlpha(entry.style, colors)) as never)(
        theme as never
      ) as Declarations
    )
  });
  if (groupHover) resolved.groupHoverStyle = resolveGroup(groupHover);
  if (groupActive) resolved.groupActiveStyle = resolveGroup(groupActive);
  return resolved;
}
