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

import type { CSSProperties } from "react";
import type { Theme, ThemeColor } from "@notesnook/theme";
import type {
  CSSPseudoSelectorProps,
  StylePropertyValue,
  Theme as ThemeUITheme,
  ThemeUICSSProperties
} from "@theme-ui/css";

// The kit's `sx` is theme-ui's: every key and value apps/web writes
// type-checks, so a file shared with apps/web needs no changes. What desktop
// draws of it is narrower (see docs/ui-kit-web-api.md): lengths in px, %, rem,
// em, vw and vh, CSS colours, flexbox, the state keys below, linear gradients
// and keyframe animations of opacity and transform. Keys and values it cannot
// draw (selectors, grid, tables, scroll snapping) are accepted and ignored.

type ThemeSpace = Theme["space"];
/** Any CSS value: kept as written, so the named ones still autocomplete. */
type CssString = string & {};

export type ColorToken = ThemeColor | "transparent";

declare const dataColorBrand: unique symbol;
export type DataColor = string & { readonly [dataColorBrand]: true };
/** A theme token written as the CSS variable apps/web uses, `var(--accent)`. */
export type CssVarColor = `var(--${ColorToken})`;
/**
 * A theme token, or any CSS colour (`#rrggbb`, `rgb()`, `rgba()`, a colour
 * name, `currentColor`).
 */
export type ColorValue = ColorToken | DataColor | CssVarColor | CssString;

/**
 * A colour from user data (a note's colour, a colour tag): a hex colour
 * (#rgb, #rgba, #rrggbb or #rrggbbaa); throws for anything else.
 */
export declare function dataColor(hex: string): DataColor;

/**
 * Emotion's `keyframes` tag: the name of the rule, to be written into an
 * `animation` string (`${fadeIn} 1s ease-out`). Desktop animates opacity,
 * transform and colours.
 */
export declare function keyframes(
  template: TemplateStringsArray,
  ...values: unknown[]
): string;
export type SpaceToken =
  | Exclude<keyof ThemeSpace, keyof Array<unknown> | "small" | "auto">
  | "small"
  | "auto"
  | `${number}px`
  | `${number}%`
  | number
  | CssString;
export type RadiusToken =
  | keyof Theme["radii"]
  | number
  | `${number}px`
  | `${number}%`
  | CssString;
/** `rem` and `em` are drawn as multiples of 16px. */
export type FontSizeToken = keyof Theme["fontSizes"] | number | CssString;
export type FontFamilyToken = keyof Theme["fonts"] | CssString;
/** `bolder` is drawn as 700. */
export type FontWeightToken =
  | keyof Theme["fontWeights"]
  | number
  | "bolder"
  | CssString;
export type ShadowToken = keyof Theme["shadows"] | CssString;
export type IconSizeToken = keyof Theme["iconSizes"] | number;

/**
 * `vw` and `vh` are a share of the window, measured when the style is drawn;
 * `rem` and `em` are multiples of 16px.
 */
export type Length =
  | number
  | `${number}px`
  | `${number}%`
  | `${number}vw`
  | `${number}vh`
  | `${number}rem`
  | "auto"
  /** Drawn as the default size: desktop boxes already fit their content. */
  | "fit-content"
  | CssString;
export type Responsive<T> = T | (T | null)[];

type BorderLineStyle = "solid" | "dashed" | "dotted";
export type Border =
  | "none"
  /** As in CSS: no border. */
  | 0
  | `${number}px ${BorderLineStyle}`
  | `${number}px ${BorderLineStyle} ${ColorToken}`
  | `${number}px ${BorderLineStyle} ${CssVarColor}`
  | CssString;

export type Transform = {
  translateX?: number;
  translateY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: `${number}deg`;
}[];

/**
 * A CSS transform function, as apps/web writes it. A percentage in a
 * translate is of the element's own size; desktop resolves it for icons.
 */
export type CssTransform =
  `${"translate" | "translateX" | "translateY" | "scale" | "rotate"}(${string})`;

export type AnimatableProperty =
  | "opacity"
  | "transform"
  | "backgroundColor"
  | "color"
  | "borderColor";

type Easing = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out";

export type TransitionSpec = {
  property: AnimatableProperty | AnimatableProperty[];
  duration: number;
  delay?: number;
  easing?: Easing;
};

export type Keyframes = Partial<
  Record<
    "from" | "to" | `${number}%`,
    { opacity?: number; transform?: Transform; bg?: ColorValue }
  >
>;

export type AnimationSpec = {
  keyframes: Keyframes;
  duration: number;
  delay?: number;
  iterationCount?: number | "infinite";
  easing?: Easing;
};

type SpaceKeys =
  | "m"
  | "mt"
  | "mr"
  | "mb"
  | "ml"
  | "mx"
  | "my"
  | "margin"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "marginX"
  | "marginY"
  | "p"
  | "pt"
  | "pr"
  | "pb"
  | "pl"
  | "px"
  | "py"
  | "padding"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "paddingX"
  | "paddingY"
  | "gap"
  | "rowGap"
  | "columnGap";

/**
 * A theme callback. The theme is the Notesnook theme and theme-ui's at once,
 * so a callback written for either type-checks.
 */
export type ThemeCallback<T = unknown> = (theme: Theme & ThemeUITheme) => T;
type Empty = undefined | null | false;
/** theme-ui's responsive value: one value, or one per breakpoint. */
type ResponsiveValue<T> = T | Empty | (T | Empty)[];
type NotCallable<T> = Exclude<T, (...args: never[]) => unknown>;

/** The colour props of a theme-ui component. */
export type ColorProps = {
  color?: ResponsiveValue<ColorValue>;
  bg?: ResponsiveValue<ColorValue>;
  backgroundColor?: ResponsiveValue<ColorValue>;
};

/**
 * The spacing props of a theme-ui component. Spacing may also be a theme
 * callback: desktop resolves it with the same css() pass that resolves the
 * tokens.
 */
export type SpaceProps = {
  [K in SpaceKeys]?:
    | ResponsiveValue<SpaceToken>
    | ThemeCallback;
};

/**
 * The style of a state (`:hover`, `:focus`…). Desktop draws its colours,
 * opacity, outline, shadow and transform.
 */
export type StateStyle = SxStyle;

export type GroupStateStyle = { group: string; style: SxProp };

/** The keys only the kit has, and the kit-only shapes of three CSS ones. */
type KitKeys = {
  /**
   * Styles for the text fields inside this element, as web's nested `input`
   * selector: drawn over the field's own styles.
   */
  input?: SxStyle;
  /** Applied while the element's `disabled` prop is set. */
  ":disabled"?: StateStyle;
  ":drag-over"?: StateStyle;
  ":group-hover"?: GroupStateStyle;
  ":group-active"?: GroupStateStyle;
  /** A list of transform parts, or the CSS string apps/web writes. */
  transform?: Transform | CssTransform | ThemeUICSSProperties["transform"];
  /**
   * The kit's object, or a CSS `transition` string: desktop draws the
   * properties in AnimatableProperty and ignores the others.
   */
  transition?: TransitionSpec | ThemeUICSSProperties["transition"];
  /**
   * The kit's object, or a CSS `animation` string naming keyframes made with
   * the kit's `keyframes` or written in a `<style>` element.
   */
  animation?: AnimationSpec | ThemeUICSSProperties["animation"];
  experimental_backgroundImage?: string;
  experimental_backgroundSize?: string;
  experimental_backgroundPosition?: string;
  /** theme-ui's width + height shorthand. */
  size?: ThemeUICSSProperties["size"] | Responsive<Length>;
};

// theme-ui's own callbacks take theme-ui's theme; with one callback type per
// key, `(theme) => …` gets its parameter type from the kit's.
type SpaceCallbacks = {
  [K in SpaceKeys]?:
    | NotCallable<ThemeUICSSProperties[K]>
    | ThemeCallback;
};

type KitValue =
  | Transform
  | TransitionSpec
  | AnimationSpec
  | GroupStateStyle
  | ThemeCallback
  | SxStyle;

/**
 * theme-ui's style object (every CSS property with theme lookups, responsive
 * arrays and theme callbacks, pseudo selectors, nested selectors), with the
 * kit's own keys.
 */
export type SxProp = Omit<
  ThemeUICSSProperties,
  keyof KitKeys | SpaceKeys
> &
  // Pseudo selectors (`:hover`, `::placeholder`…), each a nested `sx`.
  { [K in keyof CSSPseudoSelectorProps<ThemeUITheme>]?: SxStyle } &
  KitKeys &
  SpaceCallbacks & {
    variant?: string;
    label?: string;
    // Nested selectors (`"& strong"`, `th`), and CSS properties not named
    // above. An index signature has to cover every key, so it lists the
    // kit's own shapes too.
    [selectorOrProperty: string]:
      | StylePropertyValue<string | number>
      | KitValue
      | undefined;
  };

/**
 * An `sx` object, or theme-ui's function of the theme that returns one: what
 * a component's `sx` prop and a nested selector take.
 */
export type SxStyle = SxProp | ThemeCallback<SxProp>;

export type ThemeUICSSObject = SxProp;
export type ThemeUIStyleObject = SxStyle;
export type RestrictedSxProp = SxProp;

/**
 * An inline style, as React's `style`: CSS properties with no theme lookups
 * and no responsive arrays. Desktop draws the ones it draws of `sx`.
 */
export type StyleProp = CSSProperties;

export type ThemeScopeName =
  | "base"
  | "navigationMenu"
  | "statusBar"
  | "titleBar"
  | "list"
  | "contextMenu"
  | "editor"
  | "editorToolbar"
  | "editorSidebar"
  | "dialog"
  | "sheet";
