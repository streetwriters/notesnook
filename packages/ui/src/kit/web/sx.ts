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

import { keyframes } from "@emotion/react";
import { lineHeightRatio } from "../shared/style/line-height";

/**
 * theme-ui turns `sx` into CSS. This only rewrites the few values the kit's
 * contract writes differently from CSS (the kit-only shapes desktop needs)
 * into what theme-ui takes; every other key is passed through untouched.
 * An `sx` with none of them is returned as is.
 */

type Style = Record<string, unknown>;

const GROUP_STATES: Record<string, string> = {
  ":group-hover": ":hover",
  ":group-active": ":active"
};

const RENAMED: Record<string, string> = {
  ":drag-over": "&[data-drag-over]",
  experimental_backgroundImage: "backgroundImage",
  experimental_backgroundSize: "backgroundSize",
  experimental_backgroundPosition: "backgroundPosition"
};

const BORDER = /^(border(Top|Right|Bottom|Left)?|outline)$/;
const TOKEN = /^[a-zA-Z][\w-]*$/;
const CSS_COLOR_WORDS = new Set([
  "transparent",
  "currentColor",
  "inherit",
  "white",
  "black",
  "red",
  "none"
]);

function kebab(name: string) {
  return name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

/** A theme colour token as the CSS variable the theme scope defines. */
function colorOf(value: unknown) {
  return typeof value === "string" &&
    TOKEN.test(value) &&
    !CSS_COLOR_WORDS.has(value)
    ? `var(--${value})`
    : value;
}

function transformToCss(parts: Record<string, number | string>[]) {
  return parts
    .flatMap((part) =>
      Object.entries(part).map(([name, value]) =>
        typeof value !== "number"
          ? `${name}(${value})`
          : name.startsWith("scale")
          ? `${name}(${value})`
          : name === "rotate"
          ? `${name}(${value}deg)`
          : `${name}(${value}px)`
      )
    )
    .join(" ");
}

function transitionToCss(input: {
  property: string | string[];
  duration: number;
  delay?: number;
  easing?: string;
}) {
  const properties = Array.isArray(input.property)
    ? input.property
    : [input.property];
  return properties
    .map(
      (property) =>
        `${kebab(property)} ${input.duration}ms ${input.easing ?? "ease"} ${
          input.delay ?? 0
        }ms`
    )
    .join(", ");
}

const animationNames = new Map<string, ReturnType<typeof keyframes>>();

function animationToCss(input: {
  keyframes: Record<string, Style>;
  duration: number;
  delay?: number;
  iterationCount?: number | "infinite";
  easing?: string;
}) {
  const frames = Object.entries(input.keyframes)
    .map(([step, frame]) => {
      let body = "";
      for (const key in frame) {
        const value = frame[key];
        if (value === undefined || value === null) continue;
        if (key === "transform" && Array.isArray(value))
          body += `transform:${transformToCss(value)};`;
        else if (key === "bg" || key === "backgroundColor")
          body += `background-color:${colorOf(value)};`;
        else body += `${kebab(key)}:${value};`;
      }
      return `${step}{${body}}`;
    })
    .join("");
  let name = animationNames.get(frames);
  if (!name) animationNames.set(frames, (name = keyframes(frames)));
  return `${name} ${input.duration}ms ${input.easing ?? "ease"} ${
    input.delay ?? 0
  }ms ${input.iterationCount ?? 1}`;
}

function isObject(value: unknown): value is Style {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

const cache = new WeakMap<object, unknown>();

export function toThemeUISx<T>(sx: T): T {
  if (!isObject(sx)) return sx;
  if (cache.has(sx)) return cache.get(sx) as T;
  const source: Style = sx;
  let out: Style | undefined;
  const edit = () => (out ??= { ...source });
  for (const key in source) {
    const value = source[key];
    if (key in GROUP_STATES && isObject(value) && "group" in value) {
      const target = edit();
      delete target[key];
      target[`.nn-group-${value.group}${GROUP_STATES[key]} &`] = toThemeUISx(
        value.style
      );
    } else if (key in RENAMED) {
      const target = edit();
      delete target[key];
      target[RENAMED[key]] = toThemeUISx(value);
    } else if (key === "transition" && isObject(value))
      edit().transition = transitionToCss(value as never);
    else if (key === "animation" && isObject(value))
      edit().animation = animationToCss(value as never);
    else if (key === "transform" && Array.isArray(value))
      edit().transform = transformToCss(value);
    else if (key === "lineHeight" && typeof value === "number") {
      if (lineHeightRatio(value) === undefined)
        edit().lineHeight = `${value}px`;
    } else if (key === "lineClamp") {
      const target = edit();
      delete target.lineClamp;
      if (value)
        Object.assign(target, {
          display: "-webkit-box",
          WebkitLineClamp: value,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          whiteSpace: "normal"
        });
    } else if (BORDER.test(key) && typeof value === "string") {
      const parts = value.split(" ");
      // width, style and colour: only the third word can be a colour token
      const last = parts.length > 2 ? colorOf(parts[parts.length - 1]) : "";
      if (last && last !== parts[parts.length - 1]) {
        parts[parts.length - 1] = last as string;
        edit()[key] = parts.join(" ");
      }
    } else if (isObject(value)) {
      const nested = toThemeUISx(value);
      if (nested !== value) edit()[key] = nested;
    }
  }
  const result = out ?? source;
  cache.set(sx, result);
  return result as T;
}
