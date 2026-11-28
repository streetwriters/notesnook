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

// The HTML elements apps/web writes as raw JSX (`<strong>`, `<span>`,
// `<style>`, `<table>`…), drawn with the kit. React Native has no such host
// components, so desktop-native's Babel plugin (tools/babel-plugin-dom-elements)
// rewrites each lowercase tag in src/app to the member of `Dom` with that
// name: `<strong>` becomes `<Dom.strong>`. A file shared with apps/web keeps
// its raw tags.
//
// Each element takes the DOM attributes the kit's elements take (`style`,
// `className`, `id`, `onClick`…); the tag is passed on as `as`, which is what
// nested selectors in `sx` match on.

import {
  Children,
  cloneElement,
  createElement,
  forwardRef,
  isValidElement,
  type ComponentType,
  type ReactElement,
  type ReactNode
} from "react";
import { SvgXml } from "react-native-svg";
import type { SxProp } from "../contracts/style";
import { registerStylesheet } from "../shared/style/css-motion";
import { mergeSx } from "../shared/style/shorthand";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Image,
  Input,
  Label,
  Link,
  Radio,
  Text,
  Textarea
} from "./primitives";
import { Select } from "./select";
import { resolveCssVars } from "./style/resolve";
import { useThemeContext } from "./theme";

type Props = Record<string, any>;
type DomComponent = ComponentType<any>;

function element(
  Component: DomComponent,
  tag: string,
  defaults?: SxProp
): DomComponent {
  const Element = forwardRef<unknown, Props>(function Element(props, ref) {
    return createElement(Component, {
      as: tag,
      ...props,
      ref,
      sx: defaults ? mergeSx(defaults, props.sx) : props.sx
    });
  });
  Element.displayName = tag;
  return Element;
}

const HEADING_SIZES: Record<string, number> = {
  h1: 32,
  h2: 24,
  h3: 19,
  h4: 16,
  h5: 13,
  h6: 11
};

const svgSymbols = new Map<string, string>();

/**
 * Registers an SVG document under the id a `<use href="#id" />` refers to, as
 * the symbols of the sprite in apps/web's index.html.
 */
export function registerSvgSymbol(id: string, svg: string) {
  svgSymbols.set(id, svg);
}

function numberOf(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && /^-?\d*\.?\d+(px)?$/.test(value))
    return parseFloat(value);
  return undefined;
}

/**
 * `<svg><use href="#symbol" /></svg>` draws a registered symbol at the size
 * its `style` or attributes give. Any other inline SVG draws nothing: write
 * those with the kit's `Icon`.
 */
function Svg(props: Props) {
  let symbol: string | undefined;
  Children.forEach(props.children, (child) => {
    if (!isValidElement(child)) return;
    const href = (child.props as Props).href ?? (child.props as Props).xlinkHref;
    if (typeof href === "string" && href.startsWith("#"))
      symbol ??= svgSymbols.get(href.slice(1));
  });
  const { colors } = useThemeContext();
  if (!symbol) return null;
  const style: Props = props.style ?? {};
  const width = numberOf(style.width) ?? numberOf(props.width) ?? 24;
  const height = numberOf(style.height) ?? numberOf(props.height) ?? width;
  return (
    <Box
      className={props.className}
      style={{ ...style, width, height }}
      sx={props.sx}
    >
      <SvgXml
        xml={resolveCssVars(symbol, colors)}
        width={width}
        height={height}
      />
    </Box>
  );
}

/** A `<style>` element: its `@keyframes` rules are registered by name. */
function Style(props: { children?: ReactNode }) {
  const css = Children.toArray(props.children)
    .filter((child) => typeof child === "string")
    .join("");
  // While rendering, so the elements drawn after it find the keyframes.
  if (css) registerStylesheet(css);
  return null;
}

/** `<input>`: a checkbox, a radio or a text field, by its `type`. */
const InputElement = forwardRef<unknown, Props>(function InputElement(
  props,
  ref
) {
  const Component: DomComponent =
    props.type === "checkbox" ? Checkbox : props.type === "radio" ? Radio : Input;
  return createElement(Component, { ...props, ref });
});

function List(ordered: boolean) {
  return forwardRef<unknown, Props>(function List(props, ref) {
    let index = 0;
    return (
      <Box
        as={ordered ? "ol" : "ul"}
        {...props}
        ref={ref as never}
        sx={mergeSx({ flexDirection: "column", pl: 2 }, props.sx)}
      >
        {Children.map(props.children, (child) =>
          isValidElement(child)
            ? cloneElement(child as ReactElement<Props>, {
                "data-marker": ordered ? `${++index}.` : "•"
              })
            : child
        )}
      </Box>
    );
  });
}

const ListItem = forwardRef<unknown, Props>(function ListItem(props, ref) {
  const { "data-marker": marker = "•", children, ...rest } = props;
  return (
    <Flex
      as="li"
      {...rest}
      ref={ref as never}
      sx={mergeSx({ flexDirection: "row", alignItems: "flex-start" }, rest.sx)}
    >
      <Text sx={{ mr: 1, flexShrink: 0 }}>{marker}</Text>
      <Box sx={{ flex: 1, minWidth: 0 }}>{children}</Box>
    </Flex>
  );
});

const bold: SxProp = { fontWeight: "bold" };
const italic: SxProp = { fontStyle: "italic" };
const mono: SxProp = { fontFamily: "monospace" };
const column: SxProp = { flexDirection: "column" };
// Table cells share the row equally: desktop has no table layout to size
// columns by their content.
const cell: SxProp = { flex: 1, minWidth: 0 };

export const Dom: Record<string, DomComponent> = {
  div: element(Box, "div"),
  section: element(Box, "section"),
  header: element(Box, "header"),
  footer: element(Box, "footer"),
  nav: element(Box, "nav"),
  main: element(Box, "main"),
  article: element(Box, "article"),
  aside: element(Box, "aside"),
  form: element(Box, "form"),
  fieldset: element(Box, "fieldset"),
  span: element(Text, "span"),
  p: element(Text, "p"),
  time: element(Text, "time"),
  small: element(Text, "small", { fontSize: "subBody" }),
  strong: element(Text, "strong", bold),
  b: element(Text, "b", bold),
  em: element(Text, "em", italic),
  i: element(Text, "i", italic),
  u: element(Text, "u", { textDecorationLine: "underline" }),
  s: element(Text, "s", { textDecorationLine: "line-through" }),
  code: element(Text, "code", mono),
  pre: element(Text, "pre", mono),
  h1: element(Text, "h1", { ...bold, fontSize: HEADING_SIZES.h1 }),
  h2: element(Text, "h2", { ...bold, fontSize: HEADING_SIZES.h2 }),
  h3: element(Text, "h3", { ...bold, fontSize: HEADING_SIZES.h3 }),
  h4: element(Text, "h4", { ...bold, fontSize: HEADING_SIZES.h4 }),
  h5: element(Text, "h5", { ...bold, fontSize: HEADING_SIZES.h5 }),
  h6: element(Text, "h6", { ...bold, fontSize: HEADING_SIZES.h6 }),
  a: element(Link, "a"),
  label: element(Label, "label"),
  button: element(Button, "button"),
  img: element(Image, "img"),
  input: InputElement,
  textarea: element(Textarea, "textarea"),
  select: Select,
  hr: element(Box, "hr", { height: 1, bg: "border", my: 2 }),
  ul: List(false),
  ol: List(true),
  li: ListItem,
  table: element(Box, "table", column),
  thead: element(Box, "thead", column),
  tbody: element(Box, "tbody", column),
  tfoot: element(Box, "tfoot", column),
  tr: element(Flex, "tr", { flexDirection: "row" }),
  th: element(Box, "th", { ...cell, ...bold }),
  td: element(Box, "td", cell),
  svg: Svg,
  style: Style
};
