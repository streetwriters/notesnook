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

export type Modifiers = {
  shiftKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  metaKey: boolean;
};

export type PointerButton = "primary" | "secondary" | "auxiliary";

export interface UIEvent {
  preventDefault(): void;
  stopPropagation(): void;
}

export interface PressEvent extends UIEvent, Modifiers {
  button: PointerButton;
  detail: number;
  x: number;
  y: number;
  pageX: number;
  pageY: number;
}

export interface ContextMenuEvent extends UIEvent, Modifiers {
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
  | (string & {});

export interface KeyEvent extends UIEvent, Modifiers {
  key: Key;
  repeat: boolean;
}

export interface FocusEvent extends UIEvent {
  relatedTarget?: unknown;
}

export interface HoverEvent extends UIEvent, Modifiers {
  pageX: number;
  pageY: number;
}

export interface ScrollEvent {
  scrollTop: number;
  scrollLeft: number;
  contentHeight: number;
  contentWidth: number;
  viewportHeight: number;
  viewportWidth: number;
}
