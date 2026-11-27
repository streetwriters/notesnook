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

import type { Theme, ThemeColor } from "@notesnook/theme";

type ThemeSpace = Theme["space"];

export type ColorToken = ThemeColor | "transparent";

declare const dataColorBrand: unique symbol;
export type DataColor = string & { readonly [dataColorBrand]: true };
/** A theme token written as the CSS variable apps/web uses, `var(--accent)`. */
export type CssVarColor = `var(--${ColorToken})`;
export type ColorValue = ColorToken | DataColor | CssVarColor;

/**
 * Colours that come from user data (a note's colour, a colour tag) are not
 * theme tokens. `dataColor` is the only way to make one: it accepts a hex
 * colour (#rgb, #rgba, #rrggbb or #rrggbbaa) and throws for anything else.
 */
export declare function dataColor(hex: string): DataColor;
export type SpaceToken =
  | Exclude<keyof ThemeSpace, keyof Array<unknown> | "small" | "auto">
  | "small"
  | "auto"
  | `${number}px`
  | number;
export type RadiusToken = keyof Theme["radii"] | number;
export type FontSizeToken = keyof Theme["fontSizes"] | number;
export type FontFamilyToken = keyof Theme["fonts"];
export type FontWeightToken = keyof Theme["fontWeights"] | number;
export type ShadowToken = keyof Theme["shadows"];
export type IconSizeToken = keyof Theme["iconSizes"] | number;

export type Length = number | `${number}px` | `${number}%` | "auto";
export type Responsive<T> = T | (T | null)[];

type BorderLineStyle = "solid" | "dashed" | "dotted";
export type Border =
  | "none"
  | `${number}px ${BorderLineStyle}`
  | `${number}px ${BorderLineStyle} ${ColorToken}`
  | `${number}px ${BorderLineStyle} ${CssVarColor}`;

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

export type ColorProps = {
  color?: ColorValue;
  bg?: ColorValue | (ColorValue | null)[];
  backgroundColor?: ColorValue | (ColorValue | null)[];
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

export type SpaceProps = {
  [K in SpaceKeys]?: Responsive<SpaceToken>;
};

export type StateStyle = ColorProps & {
  borderColor?: ColorValue;
  outlineColor?: ColorValue;
  outlineWidth?: number;
  outlineOffset?: number;
  opacity?: number;
  boxShadow?: ShadowToken;
  transform?: Transform;
};

export type GroupStateStyle = { group: string; style: StateStyle };

type LayoutProps = {
  display?: Responsive<"flex" | "none">;
  position?: "relative" | "absolute";
  top?: Length | SpaceToken;
  right?: Length | SpaceToken;
  bottom?: Length | SpaceToken;
  left?: Length | SpaceToken;
  zIndex?: number;
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: Length;
  flexDirection?: Responsive<
    "row" | "column" | "row-reverse" | "column-reverse"
  >;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  /** `start` and `end` are drawn as `flex-start` and `flex-end`. */
  alignItems?:
    | "flex-start"
    | "flex-end"
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "baseline";
  alignSelf?:
    | "auto"
    | "flex-start"
    | "flex-end"
    | "start"
    | "end"
    | "center"
    | "stretch"
    | "baseline";
  alignContent?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "stretch"
    | "space-between"
    | "space-around";
  justifyContent?:
    | "flex-start"
    | "flex-end"
    | "start"
    | "end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly";
  width?: Responsive<Length>;
  height?: Responsive<Length>;
  minWidth?: Responsive<Length>;
  minHeight?: Responsive<Length>;
  maxWidth?: Responsive<Length>;
  maxHeight?: Responsive<Length>;
  aspectRatio?: number;
  overflow?: "visible" | "hidden" | "scroll";
  /** Desktop has one overflow for both axes; the last one written wins. */
  overflowX?: "visible" | "hidden" | "scroll" | "auto";
  overflowY?: "visible" | "hidden" | "scroll" | "auto";
  /** Sets top, right, bottom and left to the same length. */
  inset?: Length;
  /** theme-ui's width + height shorthand. */
  size?: Responsive<Length>;
};

type AppearanceProps = {
  opacity?: number;
  experimental_backgroundImage?: string;
  experimental_backgroundSize?: string;
  experimental_backgroundPosition?: string;
  borderRadius?: Responsive<RadiusToken>;
  borderTopLeftRadius?: RadiusToken;
  borderTopRightRadius?: RadiusToken;
  borderBottomLeftRadius?: RadiusToken;
  borderBottomRightRadius?: RadiusToken;
  border?: Border;
  borderTop?: Border;
  borderRight?: Border;
  borderBottom?: Border;
  borderLeft?: Border;
  borderColor?: ColorValue;
  borderTopColor?: ColorValue;
  borderRightColor?: ColorValue;
  borderBottomColor?: ColorValue;
  borderLeftColor?: ColorValue;
  borderWidth?: number;
  borderTopWidth?: number;
  borderRightWidth?: number;
  borderBottomWidth?: number;
  borderLeftWidth?: number;
  borderStyle?: BorderLineStyle;
  /** A colour only; gradients and images are not drawn. */
  background?: ColorValue;
  /** "none", or width, style and colour together. */
  outline?: "none" | `${number}px ${BorderLineStyle} ${ColorToken}`;
  /** hidden draws nothing and takes no pointer events, but keeps its space. */
  visibility?: "visible" | "hidden";
  outlineColor?: ColorValue;
  outlineWidth?: number;
  outlineOffset?: number;
  outlineStyle?: "solid" | "dashed" | "dotted";
  boxShadow?: ShadowToken;
  transform?: Transform | CssTransform;
  cursor?: "default" | "pointer" | "text" | "not-allowed" | "grab" | "move";
  /** Accepted and ignored: desktop form controls follow the kit theme. */
  colorScheme?: "light" | "dark" | "normal";
  /** `all` is drawn as `auto`. */
  pointerEvents?: "auto" | "none" | "all";
  userSelect?: "auto" | "none" | "text";
  objectFit?: "cover" | "contain" | "fill";
};

type TextStyleProps = {
  fontSize?: Responsive<FontSizeToken>;
  fontFamily?: FontFamilyToken;
  fontWeight?: FontWeightToken;
  fontStyle?: "normal" | "italic";
  lineHeight?: number | `${number}px` | `${number}%` | "body" | "heading";
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecorationLine?: "none" | "underline" | "line-through";
  textDecoration?: "none" | "underline" | "line-through";
  textDecorationColor?: ColorValue;
  /** Desktop always wraps long words; accepted for parity. */
  overflowWrap?: "normal" | "break-word" | "anywhere";
  wordWrap?: "normal" | "break-word";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textOverflow?: "clip" | "ellipsis";
  whiteSpace?: "normal" | "nowrap" | "pre" | "pre-wrap";
  wordBreak?: "normal" | "break-all" | "break-word";
  lineClamp?: number;
};

type StateKeys = {
  ":hover"?: StateStyle;
  ":active"?: StateStyle;
  ":focus"?: StateStyle;
  ":focus-visible"?: StateStyle;
  /** Applied while the element's `disabled` prop is set. */
  ":disabled"?: StateStyle;
  ":drag-over"?: StateStyle;
  ":group-hover"?: GroupStateStyle;
  ":group-active"?: GroupStateStyle;
};

type MotionProps = {
  transition?: TransitionSpec;
  animation?: AnimationSpec;
};

export type SxProp = ColorProps &
  SpaceProps &
  LayoutProps &
  AppearanceProps &
  TextStyleProps &
  StateKeys &
  MotionProps;

export type ThemeUICSSObject = SxProp;
export type ThemeUIStyleObject = SxProp;
export type RestrictedSxProp = SxProp;

type Unresponsive<T> = Exclude<T, readonly unknown[]>;
type StyleLength = number | `${number}px` | "auto";
type StyleSpaceKeys =
  | "margin"
  | "marginTop"
  | "marginRight"
  | "marginBottom"
  | "marginLeft"
  | "padding"
  | "paddingTop"
  | "paddingRight"
  | "paddingBottom"
  | "paddingLeft"
  | "gap"
  | "rowGap"
  | "columnGap";

export type StyleProp = {
  [K in keyof LayoutProps]?: Unresponsive<LayoutProps[K]>;
} & {
  [K in StyleSpaceKeys]?: StyleLength;
} & {
  opacity?: number;
  visibility?: "visible" | "hidden";
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderRadius?: number;
  fontSize?: number;
  cursor?: AppearanceProps["cursor"];
  pointerEvents?: AppearanceProps["pointerEvents"];
  userSelect?: AppearanceProps["userSelect"];
  objectFit?: AppearanceProps["objectFit"];
  transform?: string;
  transition?: string;
  overscrollBehavior?: "auto" | "contain" | "none";
};

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
