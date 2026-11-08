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

import transform from "css-to-react-native";

export type Declarations = Record<string, unknown>;

export interface ConvertedStyle {
  style: Record<string, unknown>;
  numberOfLines?: number;
  selectable?: boolean;
}

const SHORTHANDS = new Set([
  "border",
  "flex",
  "margin",
  "padding",
  "borderWidth",
  "borderRadius",
  "textDecoration"
]);

const STATE_PROPERTIES = new Set([
  "backgroundColor",
  "color",
  "borderColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "opacity",
  "boxShadow",
  "transform",
  "outlineColor",
  "outlineWidth",
  "outlineOffset"
]);

const EASINGS: Record<string, string> = {
  linear: "linear",
  ease: "ease",
  "ease-in": "ease-in",
  "ease-out": "ease-out",
  "ease-in-out": "ease-in-out"
};

export interface TransitionInput {
  property: string | string[];
  duration: number;
  delay?: number;
  easing?: string;
}

export function convertTransition(transition: TransitionInput) {
  return {
    transitionProperty: transition.property,
    transitionDuration: `${transition.duration}ms`,
    transitionDelay: `${transition.delay ?? 0}ms`,
    transitionTimingFunction: EASINGS[transition.easing ?? "ease"] ?? "ease"
  };
}

export interface AnimationInput {
  keyframes: Record<string, Declarations>;
  duration: number;
  delay?: number;
  iterationCount?: number | "infinite";
  easing?: string;
}

export function convertAnimation(
  animation: AnimationInput,
  resolveKeyframe: (frame: Declarations) => Declarations
) {
  const animationName: Record<string, Declarations> = {};
  for (const stop in animation.keyframes) {
    animationName[stop] = convertStateDeclarations(
      resolveKeyframe(animation.keyframes[stop])
    );
  }
  return {
    animationName,
    animationDuration: `${animation.duration}ms`,
    animationDelay: `${animation.delay ?? 0}ms`,
    animationIterationCount: animation.iterationCount ?? 1,
    animationTimingFunction: EASINGS[animation.easing ?? "ease"] ?? "ease"
  };
}

const PX = /^(-?\d+(?:\.\d+)?)px$/;
const SIDE_BORDER = /^(?:borderTop|borderRight|borderBottom|borderLeft)$/;
const SIDE_BORDER_VALUE =
  /^(\d+(?:\.\d+)?)px\s+(?:solid|dashed|dotted)(?:\s+(\S.*))?$/;
const parseCache = new Map<string, [string, unknown][]>();

function convertValue(key: string, value: unknown): [string, unknown][] {
  if (typeof value !== "string") return [[key, value]];
  const cacheKey = `${key}\u0000${value}`;
  const hit = parseCache.get(cacheKey);
  if (hit) return hit;

  let result: [string, unknown][];
  const px = PX.exec(value);
  const sideBorder = SIDE_BORDER.test(key)
    ? SIDE_BORDER_VALUE.exec(value)
    : null;
  if (sideBorder) {
    result = [[`${key}Width`, parseFloat(sideBorder[1])]];
    if (sideBorder[2]) result.push([`${key}Color`, sideBorder[2]]);
  } else if (key === "border" && value === "none")
    result = [[`borderWidth`, 0]];
  else if (px) result = [[key, parseFloat(px[1])]];
  else if (SHORTHANDS.has(key) && /[\s]/.test(value)) {
    try {
      result = Object.entries(
        transform([[key, value]]) as Record<string, unknown>
      );
    } catch {
      result = [[key, value]];
    }
  } else if (key === "fontFamily") {
    const first = value
      .split(",")[0]
      ?.trim()
      .replace(/^["']|["']$/g, "");
    result = [[key, first || value]];
  } else if (key === "fontWeight") result = [[key, value]];
  else result = [[key, value]];

  parseCache.set(cacheKey, result);
  return result;
}

const SIDES = ["Top", "Right", "Bottom", "Left"];

export function convertDeclarations(
  declarations: Declarations
): ConvertedStyle {
  const style: Record<string, unknown> = {};
  const converted: ConvertedStyle = { style };
  let isFlex = false;
  let nowrap = false;
  let ellipsis = false;

  for (const key in declarations) {
    const value = declarations[key];
    if (value === undefined || value === null) continue;
    switch (key) {
      case "display":
        if (value === "none") style.display = "none";
        else if (value === "flex") isFlex = true;
        continue;
      case "textOverflow":
        ellipsis = value === "ellipsis";
        continue;
      case "whiteSpace":
        nowrap = value === "nowrap";
        continue;
      case "background":
        if (typeof value === "string" && !/gradient|url\(/.test(value))
          style.backgroundColor = value;
        continue;
      case "userSelect":
        converted.selectable = value !== "none";
        continue;
      case "wordBreak":
      case "outline":
      case "transition":
      case "animation":
        continue;
      case "overflowX":
      case "overflowY":
        style.overflow = value;
        continue;
    }
    for (const [convertedKey, convertedValue] of convertValue(key, value)) {
      if (
        (convertedKey === "padding" || convertedKey === "margin") &&
        typeof convertedValue === "number"
      ) {
        for (const side of SIDES)
          style[`${convertedKey}${side}`] = convertedValue;
        delete style[convertedKey];
      } else style[convertedKey] = convertedValue;
    }
  }

  if (isFlex && style.flexDirection === undefined) style.flexDirection = "row";
  if (style.flexShrink === undefined && style.flex === undefined)
    style.flexShrink = 1;
  if (nowrap || ellipsis) converted.numberOfLines = 1;
  if (
    typeof style.lineHeight === "string" &&
    /^[\d.]+%$/.test(style.lineHeight)
  )
    style.lineHeight = parseFloat(style.lineHeight) / 100;
  if (
    typeof style.lineHeight === "number" &&
    style.lineHeight < 5 &&
    typeof style.fontSize === "number"
  )
    style.lineHeight = style.lineHeight * style.fontSize;
  if (typeof style.fontWeight === "number")
    style.fontWeight = String(style.fontWeight);
  return converted;
}

export function convertStateDeclarations(declarations: Declarations) {
  const picked: Declarations = {};
  for (const key in declarations)
    if (STATE_PROPERTIES.has(key)) picked[key] = declarations[key];
  const { style } = convertDeclarations(picked);
  delete style.flexShrink;
  return style;
}
