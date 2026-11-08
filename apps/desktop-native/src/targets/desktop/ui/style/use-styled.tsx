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
  useMemo,
  useSyncExternalStore,
  type ReactNode
} from "react";
import { Dimensions, Text as NativeText } from "react-native";
import type {
  BaseProps,
  ContextMenuEvent,
  HoverEvent,
  KeyEvent,
  PressEvent,
  SxProp
} from "../../../../ui";
import { useThemeContext } from "../theme";
import { breakpointOf, resolveSx, type ResolvedStyle } from "./resolve";

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
  "textDecorationLine"
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

const SHORTHAND_KEYS = [
  "m",
  "mt",
  "mr",
  "mb",
  "ml",
  "mx",
  "my",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "marginX",
  "marginY",
  "p",
  "pt",
  "pr",
  "pb",
  "pl",
  "px",
  "py",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "paddingX",
  "paddingY",
  "gap",
  "rowGap",
  "columnGap",
  "color",
  "bg",
  "backgroundColor"
] as const;

function mergeShorthands(
  props: BaseProps,
  defaults?: SxProp
): SxProp | undefined {
  let merged: Record<string, unknown> | undefined;
  for (const key of SHORTHAND_KEYS) {
    const value = (props as Record<string, unknown>)[key];
    if (value === undefined) continue;
    (merged ??= {})[key] = value;
  }
  if (!merged && !defaults) return props.sx;
  return { ...defaults, ...merged, ...props.sx } as SxProp;
}

export interface StyledOptions {
  variantGroup?: "variants" | "text" | "buttons" | "forms";
  defaultVariant?: string;
  defaults?: SxProp;
}

export interface StyledResult {
  resolved: ResolvedStyle;
  viewStyle: Style;
  textStyle: Style | undefined;
  nativeProps: Record<string, unknown>;
}

let lastModifiers = { shift: false, ctrl: false, alt: false, meta: false };

export function recordModifiers(event: any) {
  const native = event?.nativeEvent ?? {};
  lastModifiers = {
    shift: !!native.shiftKey,
    ctrl: !!native.ctrlKey,
    alt: !!native.altKey,
    meta: !!native.metaKey
  };
}

function press(event: any): PressEvent {
  const native = {
    ...(event?.nativeEvent ?? {}),
    shiftKey: lastModifiers.shift,
    ctrlKey: lastModifiers.ctrl,
    altKey: lastModifiers.alt,
    metaKey: lastModifiers.meta
  };
  return {
    button: "primary",
    detail: 1,
    x: native.locationX ?? 0,
    y: native.locationY ?? 0,
    pageX: native.pageX ?? 0,
    pageY: native.pageY ?? 0,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {},
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

export function key(event: any): KeyEvent {
  const native = event?.nativeEvent ?? event ?? {};
  return {
    key: native.key,
    repeat: !!native.repeat,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {
      event?.preventDefault?.();
    },
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

function hover(event: any): HoverEvent {
  const native = event?.nativeEvent ?? event ?? {};
  return {
    pageX: native.pageX ?? 0,
    pageY: native.pageY ?? 0,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {},
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

function contextMenu(event: any): ContextMenuEvent {
  const native = event?.nativeEvent ?? event ?? {};
  return {
    pageX: native.pageX ?? native.x ?? 0,
    pageY: native.pageY ?? native.y ?? 0,
    shiftKey: !!native.shiftKey,
    ctrlKey: !!native.ctrlKey,
    altKey: !!native.altKey,
    metaKey: !!native.metaKey,
    preventDefault() {
      event?.preventDefault?.();
    },
    stopPropagation() {
      event?.stopPropagation?.();
    }
  };
}

export function useStyled(
  props: BaseProps & { variant?: string },
  options: StyledOptions = {}
): StyledResult {
  const context = useThemeContext();
  const breakpoint = useBreakpoint();
  const sx = mergeShorthands(props, options.defaults);
  const resolved = resolveSx(sx, context, {
    variantGroup: options.variantGroup,
    variant: props.variant ?? options.defaultVariant,
    breakpoint
  });

  return useMemo(() => {
    const viewStyle: Style = { ...resolved.style };
    let textStyle: Style | undefined;
    for (const textKey of TEXT_KEYS) {
      if (viewStyle[textKey] === undefined) continue;
      (textStyle ??= {})[textKey] = viewStyle[textKey];
    }

    const nativeProps: Record<string, unknown> = {
      testID: props.testID,
      nativeID: props.id,
      group: props.group,
      hoverStyle: resolved.hoverStyle,
      activeStyle: resolved.activeStyle,
      focusStyle: resolved.focusStyle,
      focusVisibleStyle: resolved.focusVisibleStyle,
      groupHoverStyle: resolved.groupHoverStyle,
      groupActiveStyle: resolved.groupActiveStyle,
      onContextMenu: props.onContextMenu
        ? (e: unknown) => props.onContextMenu?.(contextMenu(e))
        : undefined,
      onPointerEnter: props.onHoverIn
        ? (e: unknown) => props.onHoverIn?.(hover(e))
        : undefined,
      onPointerLeave: props.onHoverOut
        ? (e: unknown) => props.onHoverOut?.(hover(e))
        : undefined,
      onFocus: props.onFocus as never,
      onBlur: props.onBlur as never,
      onKeyDown: props.onKeyDown
        ? (e: unknown) => props.onKeyDown?.(key(e))
        : undefined,
      onKeyUp: props.onKeyUp
        ? (e: unknown) => props.onKeyUp?.(key(e))
        : undefined,
      focusable:
        props.onFocus ||
        props.onBlur ||
        props.onKeyDown ||
        props.onKeyUp ||
        resolved.focusStyle ||
        resolved.focusVisibleStyle
          ? true
          : undefined
    };
    for (const name in nativeProps)
      if (nativeProps[name] === undefined) delete nativeProps[name];
    return { resolved, viewStyle, textStyle, nativeProps };
  }, [resolved, props]);
}

export function pressHandler(props: BaseProps) {
  if (!props.onPress && !props.onDoubleClick) return undefined;
  let lastPress = 0;
  return (event: unknown) => {
    const now = Date.now();
    const pressEvent = press(event);
    if (now - lastPress < 400) {
      lastPress = 0;
      pressEvent.detail = 2;
      props.onDoubleClick?.(pressEvent);
      return;
    }
    lastPress = now;
    props.onPress?.(pressEvent);
  };
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
