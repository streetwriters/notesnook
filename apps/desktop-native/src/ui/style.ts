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
export type ColorValue = ColorToken | DataColor;

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
  | `${number}px ${BorderLineStyle} ${ColorToken}`;

export type Transform = {
  translateX?: number;
  translateY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotate?: `${number}deg`;
}[];

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
  opacity?: number;
  boxShadow?: ShadowToken;
  transform?: Transform;
};

export type GroupStateStyle = { group: string; style: StateStyle };

type LayoutProps = {
  display?: Responsive<"flex" | "none">;
  position?: "relative" | "absolute";
  top?: Length;
  right?: Length;
  bottom?: Length;
  left?: Length;
  zIndex?: number;
  flex?: number;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: Length;
  flexDirection?: Responsive<
    "row" | "column" | "row-reverse" | "column-reverse"
  >;
  flexWrap?: "nowrap" | "wrap" | "wrap-reverse";
  alignItems?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline";
  alignSelf?:
    | "auto"
    | "flex-start"
    | "flex-end"
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
};

type AppearanceProps = {
  opacity?: number;
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
  outlineColor?: ColorValue;
  outlineWidth?: number;
  outlineOffset?: number;
  outlineStyle?: "solid" | "dashed" | "dotted";
  boxShadow?: ShadowToken;
  transform?: Transform;
  cursor?: "default" | "pointer" | "text" | "not-allowed" | "grab" | "move";
  pointerEvents?: "auto" | "none";
  userSelect?: "auto" | "none" | "text";
};

type TextStyleProps = {
  fontSize?: Responsive<FontSizeToken>;
  fontFamily?: FontFamilyToken;
  fontWeight?: FontWeightToken;
  fontStyle?: "normal" | "italic";
  lineHeight?: number | `${number}px` | "body" | "heading";
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  textDecorationLine?: "none" | "underline" | "line-through";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textOverflow?: "clip" | "ellipsis";
  whiteSpace?: "normal" | "nowrap" | "pre" | "pre-wrap";
  wordBreak?: "normal" | "break-all" | "break-word";
};

type StateKeys = {
  ":hover"?: StateStyle;
  ":active"?: StateStyle;
  ":focus"?: StateStyle;
  ":focus-visible"?: StateStyle;
  ":group-hover"?: GroupStateStyle;
  ":group-active"?: GroupStateStyle;
};

export type SxProp = ColorProps &
  SpaceProps &
  LayoutProps &
  AppearanceProps &
  TextStyleProps &
  StateKeys;

export type ThemeScopeName =
  | "base"
  | "navigationMenu"
  | "statusBar"
  | "list"
  | "contextMenu"
  | "editor"
  | "sheet";
