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
  UIElement,
  UIInputElement,
  UISelectElement,
  UITextAreaElement
} from "./elements";

export type Modifiers = {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export interface UIEvent {
  preventDefault(): void;
  stopPropagation(): void;
}

export type UIEventTarget = object;

export interface UISyntheticEvent<T = UIElement> extends UIEvent {
  target: UIEventTarget;
  currentTarget: T;
}

export interface UIMouseEvent<T = UIElement>
  extends UISyntheticEvent<T>,
    Modifiers {
  button: number;
  buttons: number;
  detail: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
  /** The DOM event behind React's: on desktop the same values. */
  nativeEvent: UINativeMouseEvent;
}

export interface UINativeMouseEvent extends UIEvent, Modifiers {
  button: number;
  buttons: number;
  detail: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

export type Key =
  | "Enter"
  | "Escape"
  | "Tab"
  | "Backspace"
  | "Delete"
  | "ArrowUp"
  | "ArrowDown"
  | "ArrowLeft"
  | "ArrowRight"
  | "Home"
  | "End"
  | "PageUp"
  | "PageDown"
  | " "
  | (string & NonNullable<unknown>);

export interface UINativeKeyboardEvent extends UIEvent, Modifiers {
  key: Key;
  code: string;
  /** The DOM's legacy key code; 0 when the platform does not report one. */
  keyCode: number;
  repeat: boolean;
}

export interface UIKeyboardEvent<T = UIElement>
  extends UISyntheticEvent<T>,
    Modifiers {
  key: Key;
  code: string;
  repeat: boolean;
  nativeEvent: UINativeKeyboardEvent;
}

export interface UIFocusEvent<T = UIElement> extends UISyntheticEvent<T> {
  target: UIEventTarget & T;
  relatedTarget?: unknown;
}

export interface UIChangeEvent<
  T = UIInputElement | UITextAreaElement | UISelectElement
> extends UISyntheticEvent<T> {
  target: UIEventTarget & T;
}

export type UIFormEvent<T = UIElement> = UISyntheticEvent<T>;

export interface UIWheelEvent<T = UIElement>
  extends UISyntheticEvent<T>,
    Modifiers {
  deltaX: number;
  deltaY: number;
}

export interface UITouch {
  identifier: number;
  clientX: number;
  clientY: number;
  pageX: number;
  pageY: number;
}

export interface UITouchEvent<T = UIElement>
  extends UISyntheticEvent<T>,
    Modifiers {
  touches: ArrayLike<UITouch>;
  changedTouches: ArrayLike<UITouch>;
}

export interface UIFile {
  readonly name: string;
  readonly size: number;
  readonly type: string;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface UIDataTransfer {
  readonly files: ArrayLike<UIFile>;
  readonly types: readonly string[];
  dropEffect: string;
  effectAllowed: string;
  getData(format: string): string;
  setData(format: string, data: string): void;
  clearData(format?: string): void;
}

export interface UIClipboardEvent<T = UIElement> extends UISyntheticEvent<T> {
  clipboardData: UIDataTransfer;
}

export interface UIDragEvent<T = UIElement> extends UIMouseEvent<T> {
  dataTransfer: UIDataTransfer;
}

export interface ScrollEvent {
  scrollTop: number;
  scrollLeft: number;
  contentHeight: number;
  contentWidth: number;
  viewportHeight: number;
  viewportWidth: number;
}
