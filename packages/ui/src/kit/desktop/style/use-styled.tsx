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

import {
  Children,
  createContext,
  useContext,
  useId,
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from "react";
import {
  codegenNativeCommands,
  Dimensions,
  Text as NativeText
} from "react-native";
import { DragDrop } from "@react-native-gpui/core/desktop";
import type { BaseProps, StyleProp, SxProp } from "../../contracts";
import { toPickedFile } from "../picked-file";
import { mergeShorthands } from "../../shared/style/shorthand";
import {
  matchRules,
  scopeHoverRules,
  type SelectorRule
} from "../../shared/style/selectors";
import { useThemeContext } from "../theme";
import { setScrollCommand } from "../element";
import { keyboardEvent, lastPointer } from "./events";
import {
  nativeEventProps,
  pressHandler,
  type NativeHost
} from "./native-props";
import {
  breakpointOf,
  resolveSx,
  withDisabledStyle,
  type ResolvedStyle
} from "./resolve";

export { lastPointer, pressHandler };

const TEXT_KEYS = [
  "color",
  "fontSize",
  "fontFamily",
  "fontWeight",
  "fontStyle",
  "lineHeight",
  "letterSpacing",
  "textAlign",
  "textTransform",
  "textDecorationLine",
  "textDecorationColor"
] as const;

type Style = Record<string, unknown>;

export const InheritedTextStyle = createContext<Style | undefined>(undefined);

const currentBreakpoints: string[] = ["480px", "1000px", "1000px"];
const listeners = new Set<() => void>();
let bucket = breakpointOf(Dimensions.get("window").width, currentBreakpoints);
Dimensions.addEventListener(
  "change",
  ({ window }: { window: { width: number } }) => {
    const next = breakpointOf(window.width, currentBreakpoints);
    if (next === bucket) return;
    bucket = next;
    listeners.forEach((listener) => listener());
  }
);

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useBreakpoint() {
  return useSyncExternalStore(subscribe, () => bucket);
}

export interface StyledOptions {
  variantGroup?: "variants" | "text" | "buttons" | "forms";
  defaultVariant?: string;
  defaults?: SxProp;
  /** The element's HTML tag on the web, for nested selectors; `as` wins. */
  tag?: string;
}

/** The nested selector rules of the elements above (see selectors.ts). */
const SelectorRules = createContext<readonly SelectorRule[] | undefined>(
  undefined
);

/** Hands an element's nested selector rules to the kit elements below it. */
export function SelectorScope(props: {
  rules: SelectorRule[] | undefined;
  children: ReactNode;
}) {
  const above = useContext(SelectorRules);
  const rules = useMemo(
    () => (props.rules ? [...(above ?? []), ...props.rules] : above),
    [above, props.rules]
  );
  if (!props.rules) return <>{props.children}</>;
  return (
    <SelectorRules.Provider value={rules}>
      {props.children}
    </SelectorRules.Provider>
  );
}

export interface StyledResult {
  resolved: ResolvedStyle;
  viewStyle: Style;
  textStyle: Style | undefined;
  nativeProps: Record<string, unknown>;
}

const host: NativeHost = {
  getPayload: () => DragDrop.getPayload(),
  setPayload: (payload) => DragDrop.setPayload(payload),
  toFile: toPickedFile
};

const ScrollCommands = codegenNativeCommands<{
  scrollTo: (ref: never, x: number, y: number, animated: boolean) => void;
}>({ supportedCommands: ["scrollTo"] });
setScrollCommand((node, x, y, animated) =>
  ScrollCommands.scrollTo(node as never, x, y, animated)
);

/** `style` is laid over `sx`, as an inline style is over a class on the web. */
function withInlineStyle(sx: SxProp | undefined, style: StyleProp | undefined) {
  if (!style) return sx;
  const inline: Record<string, unknown> = { ...(style as object) };
  // Only the object form of `transition` is drawn on desktop.
  if (typeof inline.transition === "string") delete inline.transition;
  return { ...sx, ...inline } as SxProp;
}

const VIEWPORT_UNIT = /^(-?\d*\.?\d+)(vw|vh)$/;

/**
 * `vw` and `vh` lengths in pixels of the window as it is now; the style is
 * measured again whenever the component draws.
 */
export function withViewportUnits(style: Style): Style {
  let result: Style | undefined;
  for (const key in style) {
    const value = style[key];
    const match = typeof value === "string" ? VIEWPORT_UNIT.exec(value) : null;
    if (!match) continue;
    const window = Dimensions.get("window");
    const size = match[2] === "vw" ? window.width : window.height;
    (result ??= { ...style })[key] = (parseFloat(match[1]) / 100) * size;
  }
  return result ?? { ...style };
}

export function useStyled(
  props: BaseProps<any> & { variant?: string },
  options: StyledOptions = {}
): StyledResult {
  const context = useThemeContext();
  const breakpoint = useBreakpoint();
  const rules = useContext(SelectorRules);
  let own = mergeShorthands(props, options.defaults, context.theme);
  if (rules) {
    // As in CSS, a rule from an element above wins over the element's own
    // styles: `.parent strong` is more specific than the child's class.
    const selected = matchRules(rules, {
      tag: props.as ?? options.tag,
      className: props.className,
      id: props.id
    });
    if (selected) own = { ...own, ...selected } as SxProp;
  }
  const sx = withDisabledStyle(
    withInlineStyle(own, props.style),
    (props as { disabled?: boolean }).disabled
  );
  const base = resolveSx(sx, context, {
    variantGroup: options.variantGroup,
    variant: props.variant ?? options.defaultVariant,
    breakpoint
  });
  // Rules for the elements below while this one is hovered (`":hover .x"`)
  // are drawn with group hover: this element is the group.
  const ownGroup = useId();
  const hoverGroup = base.rules?.some((rule) => rule.hover)
    ? props.group ?? ownGroup
    : undefined;
  const resolved = useMemo(
    () =>
      hoverGroup && base.rules
        ? { ...base, rules: scopeHoverRules(base.rules, hoverGroup) }
        : base,
    [base, hoverGroup]
  );

  return useMemo(() => {
    const viewStyle: Style = withViewportUnits(resolved.style);
    let textStyle: Style | undefined;
    for (const textKey of TEXT_KEYS) {
      if (viewStyle[textKey] === undefined) continue;
      (textStyle ??= {})[textKey] = viewStyle[textKey];
    }

    const nativeProps: Record<string, unknown> = {
      hoverStyle: resolved.hoverStyle,
      activeStyle: resolved.activeStyle,
      focusStyle: resolved.focusStyle,
      focusVisibleStyle: resolved.focusVisibleStyle,
      dragOverStyle: resolved.dragOverStyle,
      groupHoverStyle: resolved.groupHoverStyle,
      groupActiveStyle: resolved.groupActiveStyle,
      ...nativeEventProps(props, host)
    };
    if (resolved.focusStyle || resolved.focusVisibleStyle)
      nativeProps.focusable = true;
    if (hoverGroup) nativeProps.group = hoverGroup;
    for (const name in nativeProps)
      if (nativeProps[name] === undefined) delete nativeProps[name];
    return { resolved, viewStyle, textStyle, nativeProps };
  }, [resolved, props, hoverGroup]);
}

export function useMergedTextStyle(own: Style | undefined): Style | undefined {
  const inherited = useContext(InheritedTextStyle);
  return useMemo(
    () => (own ? { ...inherited, ...own } : inherited),
    [inherited, own]
  );
}

export function useInheritedTextStyle(): Style | undefined {
  return useContext(InheritedTextStyle);
}

export function wrapChildren(children: ReactNode, textStyle?: Style) {
  return Children.map(children, (child) =>
    typeof child === "string" || typeof child === "number" ? (
      <NativeText style={textStyle as never}>{child}</NativeText>
    ) : (
      child
    )
  );
}
