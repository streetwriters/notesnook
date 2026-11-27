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

import type {
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithChildren,
  ReactNode,
  RefAttributes
} from "react";
import type { Theme, ThemeDefinition } from "@notesnook/theme";
import type {
  UIElement,
  UIInputElement,
  UISelectElement,
  UITextAreaElement
} from "./elements";
import type {
  UIChangeEvent,
  UIClipboardEvent,
  UIDragEvent,
  UIFocusEvent,
  UIFormEvent,
  UIKeyboardEvent,
  UIMouseEvent,
  UISyntheticEvent,
  UITouchEvent,
  UIWheelEvent
} from "./events";
import type {
  ColorProps,
  IconSizeToken,
  ColorValue,
  SpaceProps,
  StyleProp,
  SxProp,
  ThemeScopeName
} from "./style";

export type { UIElement } from "./elements";

export interface DroppedFile {
  name: string;
  size: number;
  type: string;
  uri: string;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
}

export interface PointerMoveEvent {
  x: number;
  y: number;
  pageX: number;
  pageY: number;
  buttons: number;
}

export type ElementTag =
  | "a"
  | "code"
  | "div"
  | "fieldset"
  | "form"
  | "input"
  | "label"
  | "legend"
  | "li"
  | "ol"
  | "p"
  | "pre"
  | "span"
  | "strong"
  | "summary"
  | "table"
  | "tbody"
  | "td"
  | "textarea"
  | "th"
  | "thead"
  | "time"
  | "tr"
  | "ul";

export interface DataAttributes {
  [name: `data-${string}`]: string | number | boolean | undefined;
}

export interface AriaAttributes {
  /** The DOM role (web e2e finds menus by it); the desktop kit ignores it. */
  role?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
}

export interface BaseProps<T = UIElement>
  extends SpaceProps,
    ColorProps,
    DataAttributes,
    AriaAttributes {
  sx?: SxProp;
  style?: StyleProp;
  className?: string;
  as?: ElementTag;
  id?: string;
  title?: string;
  dir?: "ltr" | "rtl" | "auto";
  tabIndex?: number;
  group?: string;
  onClick?(event: UIMouseEvent<T>): void;
  onAuxClick?(event: UIMouseEvent<T>): void;
  onDoubleClick?(event: UIMouseEvent<T>): void;
  onContextMenu?(event: UIMouseEvent<T>): void;
  onMouseDown?(event: UIMouseEvent<T>): void;
  onMouseUp?(event: UIMouseEvent<T>): void;
  onMouseMove?(event: UIMouseEvent<T>): void;
  onMouseEnter?(event: UIMouseEvent<T>): void;
  onMouseLeave?(event: UIMouseEvent<T>): void;
  onTouchStart?(event: UITouchEvent<T>): void;
  onTouchMove?(event: UITouchEvent<T>): void;
  onTouchEnd?(event: UITouchEvent<T>): void;
  onWheel?(event: UIWheelEvent<T>): void;
  onPointerDown?(event: PointerMoveEvent): void;
  onPointerMove?(event: PointerMoveEvent): void;
  onPointerUp?(event: PointerMoveEvent): void;
  onFocus?(event: UIFocusEvent<T>): void;
  onBlur?(event: UIFocusEvent<T>): void;
  onKeyDown?(event: UIKeyboardEvent<T>): void;
  onKeyUp?(event: UIKeyboardEvent<T>): void;
  onKeyPress?(event: UIKeyboardEvent<T>): void;
  onSubmit?(event: UIFormEvent<T>): void;
  draggable?: boolean;
  onDragStart?(event: UIDragEvent<T>): unknown;
  onDragEnd?(event: UIDragEvent<T>): void;
  onDragEnter?(event: UIDragEvent<T>): void;
  onDragOver?(event: UIDragEvent<T>): void;
  onDragLeave?(event: UIDragEvent<T>): void;
  onDrop?(event: UIDragEvent<T>): void;
}

export interface BoxProps extends BaseProps {
  /**
   * One of the theme's layout variants. Other names are accepted, as theme-ui
   * accepts them, so a component can narrow `variant` to its own names; a
   * name the theme does not define draws no variant.
   */
  variant?: keyof Theme["variants"] | (string & {});
  children?: ReactNode;
}

export interface FlexProps extends BoxProps {}

export interface GridProps extends BoxProps {
  columns: number;
}

/** theme-ui's dotted variant path from the theme root, `text.body`. */
export type TextVariantPath = `text.${keyof Theme["text"] & string}`;

export interface TextProps extends BaseProps {
  variant?: keyof Theme["text"] | TextVariantPath;
  selectable?: boolean;
  dangerouslySetInnerHTML?: { __html: string };
  href?: string;
  target?: "_blank" | "_self";
  rel?: string;
  children?: ReactNode;
}

export interface ButtonProps extends BaseProps {
  variant?: keyof Theme["buttons"];
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  /** Focuses the button when it mounts. */
  autoFocus?: boolean;
  /** The `id` of the form (a `Box as="form"`) the button submits. */
  form?: string;
  /** `false` keeps focus where it was when the button is pressed. */
  focusable?: boolean;
  children?: ReactNode;
}

export interface LabelProps extends BaseProps {
  variant?: keyof Theme["forms"] | TextVariantPath;
  htmlFor?: string;
  children?: ReactNode;
}

export interface LinkProps extends BaseProps {
  variant?: keyof Theme["variants"] | keyof Theme["text"] | TextVariantPath;
  href?: string;
  target?: "_blank" | "_self";
  rel?: string;
  children?: ReactNode;
}

export interface ImageProps extends BaseProps {
  src: string;
  alt?: string;
  onLoad?: (event: UISyntheticEvent) => void;
}

export interface InputProps extends BaseProps<UIInputElement> {
  variant?: keyof Theme["forms"];
  type?:
    | "text"
    | "password"
    | "email"
    | "number"
    | "search"
    | "checkbox"
    | "radio"
    | "color"
    | "hidden";
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  selectTextOnFocus?: boolean;
  required?: boolean;
  pattern?: string;
  autoComplete?: string;
  inputMode?:
    | "none"
    | "text"
    | "tel"
    | "url"
    | "email"
    | "numeric"
    | "decimal"
    | "search";
  onPaste?: (event: UIClipboardEvent<UIInputElement>) => void;
  onChange?: (event: UIChangeEvent<UIInputElement>) => void;
}

export interface TextareaProps extends BaseProps<UITextAreaElement> {
  variant?: keyof Theme["forms"];
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  rows?: number;
  spellCheck?: boolean;
  wrap?: "soft" | "hard" | "off";
  selectTextOnFocus?: boolean;
  onChange?: (event: UIChangeEvent<UITextAreaElement>) => void;
}

export interface CheckboxProps extends BaseProps<UIInputElement> {
  variant?: keyof Theme["forms"];
  name?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (event: UIChangeEvent<UIInputElement>) => void;
}

export interface RadioProps extends BaseProps<UIInputElement> {
  variant?: keyof Theme["forms"];
  checked?: boolean;
  defaultChecked?: boolean;
  value?: string;
  name?: string;
  disabled?: boolean;
  onChange?: (event: UIChangeEvent<UIInputElement>) => void;
}

export interface SwitchProps extends BaseProps<UIInputElement> {
  variant?: keyof Theme["forms"];
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (event: UIChangeEvent<UIInputElement>) => void;
}

export interface SliderProps extends BaseProps<UIInputElement> {
  variant?: keyof Theme["forms"];
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (event: UIChangeEvent<UIInputElement>) => void;
}

export interface ProgressProps extends BaseProps {
  value?: number;
  max?: number;
}

export interface DonutProps extends BaseProps {
  value: number;
  min?: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
}

export interface IconProps extends BaseProps {
  /**
   * An SVG path (`d`) on a 24×24 grid, or a whole SVG document (anything
   * starting with `<`), drawn like `svg`: an icon's `.path` holds one of the
   * two, so apps/web's `icon: Plus.path` works for icons drawn from SVG files.
   */
  path?: string;
  svg?: string;
  size?: IconSizeToken;
  color?: ColorValue;
  rotate?: number;
}

export interface ColorPickerProps extends BaseProps {
  value: string;
  onChange: (value: string) => void;
}

export interface QRCodeProps extends BaseProps {
  value: string;
  size: number;
  ecLevel?: "L" | "M" | "Q" | "H";
  logo?: {
    src: string;
    width: number;
    height: number;
    padding?: "square" | "circle";
  };
}

export interface QRCodeHandle {
  toSVG(): string;
  toPNG(): Promise<Uint8Array>;
}

export interface SelectProps extends BaseProps<UISelectElement> {
  variant?: keyof Theme["forms"];
  name?: string;
  value?: string | number;
  defaultValue?: string | number;
  disabled?: boolean;
  onChange?: (event: UIChangeEvent<UISelectElement>) => void;
  children?: ReactNode;
}

export interface ThemeScopeProps {
  scope: ThemeScopeName;
  colorScheme?: "light" | "dark";
  theme?: ThemeDefinition;
  children?: ReactNode;
}

type Primitive<P, E = UIElement> = ForwardRefExoticComponent<
  PropsWithChildren<P> & RefAttributes<E>
>;

export declare const Box: Primitive<BoxProps>;
export declare const Flex: Primitive<FlexProps>;
export declare const Grid: Primitive<GridProps>;
export declare const Text: Primitive<TextProps>;
export declare const Button: Primitive<ButtonProps>;
export declare const Label: Primitive<LabelProps>;

/** The DOM FormData members apps/web reads. */
export interface UIFormData {
  get(name: string): string | File | null;
  getAll(name: string): (string | File)[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  append(name: string, value: string): void;
  delete(name: string): void;
  entries(): IterableIterator<[string, string | File]>;
  keys(): IterableIterator<string>;
  values(): IterableIterator<string | File>;
  forEach(
    callback: (value: string | File, key: string, parent: UIFormData) => void
  ): void;
  [Symbol.iterator](): IterableIterator<[string, string | File]>;
}

/**
 * The DOM's FormData. On desktop, `new FormData(event.target)` in a form's
 * `onSubmit` holds the value of every field with a `name` in that form (text
 * fields, and checkboxes and radios that are checked).
 */
export declare const FormData: {
  new (form?: unknown): UIFormData;
};
export declare const Link: Primitive<LinkProps>;
export declare const Image: Primitive<ImageProps>;
export declare const Input: Primitive<InputProps, UIInputElement>;
export declare const Textarea: Primitive<TextareaProps, UITextAreaElement>;
export declare const Checkbox: Primitive<CheckboxProps, UIInputElement>;
export declare const Radio: Primitive<RadioProps, UIInputElement>;
export declare const Select: Primitive<SelectProps, UISelectElement>;
export declare const QRCode: ForwardRefExoticComponent<
  QRCodeProps & RefAttributes<QRCodeHandle>
>;
export declare const ColorPicker: Primitive<ColorPickerProps>;
export declare const Switch: Primitive<SwitchProps, UIInputElement>;
export declare const Slider: Primitive<SliderProps, UIInputElement>;
export declare const Progress: Primitive<ProgressProps>;
export declare const Donut: Primitive<DonutProps>;
export declare const Icon: Primitive<IconProps>;
export declare const ThemeScope: ComponentType<ThemeScopeProps>;
