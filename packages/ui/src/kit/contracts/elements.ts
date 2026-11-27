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

export interface UIRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

export interface UIScrollIntoViewOptions {
  behavior?: "auto" | "smooth" | "instant";
  block?: "start" | "center" | "end" | "nearest";
  inline?: "start" | "center" | "end" | "nearest";
}

export interface UIScrollToOptions {
  top?: number;
  left?: number;
  behavior?: "auto" | "smooth" | "instant";
}

export interface UIElement {
  focus(options?: { preventScroll?: boolean }): void;
  blur(): void;
  getBoundingClientRect(): UIRect;
  scrollIntoView(arg?: boolean | UIScrollIntoViewOptions): void;
  scrollTo(options: UIScrollToOptions): void;
  contains(other: object | null): boolean;
  scrollTop: number;
  scrollLeft: number;
  readonly scrollHeight: number;
  readonly scrollWidth: number;
  readonly clientHeight: number;
  readonly clientWidth: number;
  readonly offsetHeight: number;
  readonly offsetWidth: number;
  readonly offsetTop: number;
  readonly offsetLeft: number;
}

export interface UITextAreaElement extends UIElement {
  value: string;
  readonly selectionStart: number | null;
  readonly selectionEnd: number | null;
  select(): void;
  setSelectionRange(start: number | null, end: number | null): void;
}

export interface UIInputElement extends UITextAreaElement {
  checked: boolean;
  valueAsNumber: number;
}

export interface UISelectElement extends UIElement {
  value: string;
}
