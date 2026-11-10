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
  ContextMenuEvent,
  FocusEvent,
  HoverEvent,
  KeyEvent,
  PressEvent
} from "./events";
import type {
  ColorProps,
  IconSizeToken,
  ColorValue,
  SpaceProps,
  SxProp,
  ThemeScopeName
} from "./style";

export interface UIElement {
  focus(): void;
  blur(): void;
  measureInWindow(
    callback: (x: number, y: number, width: number, height: number) => void
  ): void;
}

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

export interface DragEvent {
  payload: unknown;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
}

export interface BaseProps extends SpaceProps, ColorProps {
  sx?: SxProp;
  id?: string;
  testID?: string;
  title?: string;
  group?: string;
  onPress?: (event: PressEvent) => void;
  onDoubleClick?: (event: PressEvent) => void;
  onContextMenu?: (event: ContextMenuEvent) => void;
  onHoverIn?: (event: HoverEvent) => void;
  onHoverOut?: (event: HoverEvent) => void;
  onPointerDown?: (event: PointerMoveEvent) => void;
  onPointerMove?: (event: PointerMoveEvent) => void;
  onPointerUp?: (event: PointerMoveEvent) => void;
  onFocus?: (event: FocusEvent) => void;
  onBlur?: (event: FocusEvent) => void;
  onKeyDown?: (event: KeyEvent) => void;
  onKeyUp?: (event: KeyEvent) => void;
  draggable?: boolean;
  onDragStart?: () => unknown;
  onDragEnd?: (event: { dropped: boolean }) => void;
  droppable?: boolean;
  onDragEnter?: (event: DragEvent) => void;
  onDragOver?: (event: DragEvent) => void;
  onDragLeave?: (event: DragEvent) => void;
  onDrop?: (event: DragEvent) => void;
  acceptsFiles?: string[];
  onDropFiles?: (files: DroppedFile[]) => void;
}

export interface BoxProps extends BaseProps {
  variant?: keyof Theme["variants"];
  children?: ReactNode;
}

export interface FlexProps extends BoxProps {}

export interface GridProps extends BoxProps {
  columns: number;
}

export interface TextProps extends BaseProps {
  variant?: keyof Theme["text"];
  selectable?: boolean;
  numberOfLines?: number;
  children?: ReactNode;
}

export interface ButtonProps extends BaseProps {
  variant?: keyof Theme["buttons"];
  disabled?: boolean;
  children?: ReactNode;
}

export interface LabelProps extends BaseProps {
  variant?: keyof Theme["forms"];
  children?: ReactNode;
}

export interface LinkProps extends BaseProps {
  href?: string;
  children?: ReactNode;
}

export interface ImageProps extends BaseProps {
  src: string;
  alt?: string;
  resizeMode?: "cover" | "contain" | "stretch";
  onLoad?: () => void;
}

export interface InputProps extends BaseProps {
  variant?: keyof Theme["forms"];
  type?: "text" | "password" | "email" | "number" | "search";
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
  selectTextOnFocus?: boolean;
  onChangeText?: (text: string) => void;
  onSubmit?: (text: string) => void;
}

export interface TextareaProps extends Omit<InputProps, "type" | "onSubmit"> {
  rows?: number;
}

export interface CheckboxProps extends BaseProps {
  variant?: keyof Theme["forms"];
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface RadioProps extends BaseProps {
  variant?: keyof Theme["forms"];
  checked?: boolean;
  value?: string;
  name?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface SwitchProps extends BaseProps {
  variant?: keyof Theme["forms"];
  checked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
}

export interface SliderProps extends BaseProps {
  variant?: keyof Theme["forms"];
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
}

export interface ProgressProps extends BaseProps {
  value?: number;
  max?: number;
}

export interface IconProps extends BaseProps {
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

export interface SelectOption {
  value: string | number;
  title: string;
  disabled?: boolean;
}

export interface SelectProps extends BaseProps {
  options: SelectOption[];
  value?: string | number;
  onChange?: (value: string) => void;
}

export interface ThemeScopeProps {
  scope: ThemeScopeName;
  colorScheme?: "light" | "dark";
  theme?: ThemeDefinition;
  children?: ReactNode;
}

type Primitive<P> = ForwardRefExoticComponent<
  PropsWithChildren<P> & RefAttributes<UIElement>
>;

export declare const Box: Primitive<BoxProps>;
export declare const Flex: Primitive<FlexProps>;
export declare const Grid: Primitive<GridProps>;
export declare const Text: Primitive<TextProps>;
export declare const Button: Primitive<ButtonProps>;
export declare const Label: Primitive<LabelProps>;
export declare const Link: Primitive<LinkProps>;
export declare const Image: Primitive<ImageProps>;
export declare const Input: Primitive<InputProps>;
export declare const Textarea: Primitive<TextareaProps>;
export declare const Checkbox: Primitive<CheckboxProps>;
export declare const Radio: Primitive<RadioProps>;
export declare const Select: Primitive<SelectProps>;
export declare const QRCode: ForwardRefExoticComponent<
  QRCodeProps & RefAttributes<QRCodeHandle>
>;
export declare const ColorPicker: Primitive<ColorPickerProps>;
export declare const Switch: Primitive<SwitchProps>;
export declare const Slider: Primitive<SliderProps>;
export declare const Progress: Primitive<ProgressProps>;
export declare const Icon: Primitive<IconProps>;
export declare const ThemeScope: ComponentType<ThemeScopeProps>;
