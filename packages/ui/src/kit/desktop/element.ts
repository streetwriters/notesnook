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
  UIClassList,
  UIElement,
  UIInputElement,
  UIRect,
  UIScrollIntoViewOptions,
  UIScrollToOptions
} from "../contracts/elements";

/**
 * What the kit needs from a react-native-gpui host node. Every member is
 * optional so that a component instance that is not a host node still gives
 * an element that answers with zeros and does nothing.
 */
export interface NativeNode {
  focus?(): void;
  blur?(): void;
  getBoundingClientRect?(): Partial<UIRect>;
  measureInWindow?(
    callback: (x: number, y: number, width: number, height: number) => void
  ): void;
  setNativeProps?(props: Record<string, unknown>): void;
  contains?(other: unknown): boolean;
  parentNode?: NativeNode | null;
  tagName?: string;
  scrollTop?: number;
  scrollLeft?: number;
  scrollHeight?: number;
  scrollWidth?: number;
  clientHeight?: number;
  clientWidth?: number;
  offsetHeight?: number;
  offsetWidth?: number;
  offsetTop?: number;
  offsetLeft?: number;
}

/**
 * The state of a form control, kept by the component that draws it. The
 * element reads and writes it, as a DOM input holds its own value.
 */
export interface ElementControl {
  value?: string;
  checked?: boolean;
  selectionStart?: number | null;
  selectionEnd?: number | null;
  setValue?(value: string): void;
  setChecked?(checked: boolean): void;
  setSelection?(start: number, end: number): void;
  /** What a click on the control's label does. */
  click?(): void;
}

export type ScrollCommand = (
  node: NativeNode,
  x: number,
  y: number,
  animated: boolean
) => void;

let scrollCommand: ScrollCommand | undefined;

/** Sets how a scroll view's host node is scrolled. */
export function setScrollCommand(command: ScrollCommand | undefined) {
  scrollCommand = command;
}

function isScroller(node: NativeNode | null | undefined): boolean {
  return (
    !!node && typeof node.tagName === "string" && /scroll/i.test(node.tagName)
  );
}

function number(value: unknown) {
  return typeof value === "number" && !Number.isNaN(value) ? value : 0;
}

function rectOf(node: NativeNode | null | undefined): UIRect {
  const rect = node?.getBoundingClientRect?.() ?? {};
  const x = number(rect.x ?? rect.left);
  const y = number(rect.y ?? rect.top);
  const width = number(rect.width);
  const height = number(rect.height);
  return {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height
  };
}

function scrollBy(node: NativeNode, x: number, y: number, animated: boolean) {
  const maxY = number(node.scrollHeight) - number(node.clientHeight);
  const maxX = number(node.scrollWidth) - number(node.clientWidth);
  scrollCommand?.(
    node,
    Math.max(0, maxX > 0 ? Math.min(x, maxX) : x),
    Math.max(0, maxY > 0 ? Math.min(y, maxY) : y),
    animated
  );
}

function aligned(
  align: "start" | "center" | "end" | "nearest",
  start: number,
  size: number,
  viewportStart: number,
  viewportSize: number,
  scrolled: number
) {
  const offset = start - viewportStart + scrolled;
  switch (align) {
    case "start":
      return offset;
    case "end":
      return offset - viewportSize + size;
    case "center":
      return offset - (viewportSize - size) / 2;
    case "nearest":
      if (start < viewportStart) return offset;
      if (start + size > viewportStart + viewportSize)
        return offset - viewportSize + size;
      return scrolled;
  }
}

/**
 * The window position and size of an element a kit ref gave. It asks the
 * native node first, and falls back to the element's own rectangle.
 */
export function measureInWindow(
  element: UIElement | null | undefined,
  callback: (x: number, y: number, width: number, height: number) => void
) {
  const measure = (element as { measureInWindow?: unknown } | null | undefined)
    ?.measureInWindow;
  if (typeof measure === "function") return measure.call(element, callback);
  if (!element) return;
  const rect = element.getBoundingClientRect();
  callback(rect.x, rect.y, rect.width, rect.height);
}

/** The subset of `HTMLElement` the kit gives as a ref and as an event target. */
export class DesktopElement implements UIInputElement {
  control: ElementControl | undefined;
  /** The element's `onClick`, set by the component that draws it. */
  clickHandler: (() => void) | undefined;
  private classes: Set<string> | undefined;

  constructor(readonly node: NativeNode) {}

  /**
   * Class names set from code. They are kept and can be read back, but
   * nothing is drawn for them: desktop has no stylesheet to match a class
   * added after render.
   */
  get classList(): UIClassList {
    const classes = (this.classes ??= new Set());
    return {
      add: (...names) => names.forEach((name) => classes.add(name)),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const on = force ?? !classes.has(name);
        if (on) classes.add(name);
        else classes.delete(name);
        return on;
      }
    };
  }

  focus(_options?: { preventScroll?: boolean }) {
    this.node.focus?.();
  }

  blur() {
    this.node.blur?.();
  }

  /**
   * Does what a click on this element does: a control does what a click on
   * its label does, an element with `onClick` runs it, any other takes focus.
   */
  click() {
    if (this.control?.click) this.control.click();
    else if (this.clickHandler) this.clickHandler();
    else this.focus();
  }

  getBoundingClientRect(): UIRect {
    return rectOf(this.node);
  }

  measureInWindow(
    callback: (x: number, y: number, width: number, height: number) => void
  ) {
    if (this.node.measureInWindow) return this.node.measureInWindow(callback);
    const rect = rectOf(this.node);
    callback(rect.x, rect.y, rect.width, rect.height);
  }

  contains(other: object | null): boolean {
    if (!other) return false;
    const node = other instanceof DesktopElement ? other.node : other;
    if (node === this.node) return true;
    return !!this.node.contains?.(node);
  }

  scrollTo(options: UIScrollToOptions) {
    if (!isScroller(this.node)) return;
    scrollBy(
      this.node,
      options.left ?? this.scrollLeft,
      options.top ?? this.scrollTop,
      options.behavior === "smooth"
    );
  }

  scrollIntoView(arg?: boolean | UIScrollIntoViewOptions) {
    let scroller = this.node.parentNode;
    while (scroller && !isScroller(scroller)) scroller = scroller.parentNode;
    if (!scroller) return;
    const options = typeof arg === "object" ? arg : {};
    const block = options.block ?? (arg === false ? "end" : "start");
    const inline = options.inline ?? "nearest";
    const own = rectOf(this.node);
    const viewport = rectOf(scroller);
    const scrolledY = number(scroller.scrollTop);
    const scrolledX = number(scroller.scrollLeft);
    const y = aligned(
      block,
      own.top,
      own.height,
      viewport.top,
      viewport.height,
      scrolledY
    );
    const x = aligned(
      inline,
      own.left,
      own.width,
      viewport.left,
      viewport.width,
      scrolledX
    );
    if (x === scrolledX && y === scrolledY) return;
    scrollBy(scroller, x, y, options.behavior === "smooth");
  }

  get scrollTop() {
    return number(this.node.scrollTop);
  }
  set scrollTop(value: number) {
    this.scrollTo({ top: value });
  }
  get scrollLeft() {
    return number(this.node.scrollLeft);
  }
  set scrollLeft(value: number) {
    this.scrollTo({ left: value });
  }
  get scrollHeight() {
    return number(this.node.scrollHeight);
  }
  get scrollWidth() {
    return number(this.node.scrollWidth);
  }
  get clientHeight() {
    return number(this.node.clientHeight);
  }
  get clientWidth() {
    return number(this.node.clientWidth);
  }
  get offsetHeight() {
    return number(this.node.offsetHeight);
  }
  get offsetWidth() {
    return number(this.node.offsetWidth);
  }
  get offsetTop() {
    return number(this.node.offsetTop);
  }
  get offsetLeft() {
    return number(this.node.offsetLeft);
  }

  get value() {
    return this.control?.value ?? "";
  }
  set value(value: string) {
    const text = String(value);
    if (!this.control) this.control = {};
    this.control.value = text;
    this.control.setValue?.(text);
  }

  get valueAsNumber() {
    return this.value.trim() === "" ? NaN : Number(this.value);
  }
  set valueAsNumber(value: number) {
    this.value = Number.isNaN(value) ? "" : String(value);
  }

  get checked() {
    return !!this.control?.checked;
  }
  set checked(checked: boolean) {
    if (!this.control) this.control = {};
    this.control.checked = !!checked;
    this.control.setChecked?.(!!checked);
  }

  get selectionStart() {
    if (!this.control) return null;
    return this.control.selectionStart ?? this.value.length;
  }
  get selectionEnd() {
    if (!this.control) return null;
    return this.control.selectionEnd ?? this.value.length;
  }

  select() {
    this.setSelectionRange(0, this.value.length);
  }

  setSelectionRange(start: number | null, end: number | null) {
    if (!this.control) return;
    const length = this.value.length;
    const from = Math.max(0, Math.min(start ?? 0, length));
    const to = Math.max(from, Math.min(end ?? length, length));
    this.control.selectionStart = from;
    this.control.selectionEnd = to;
    this.control.setSelection?.(from, to);
  }
}

const elements = new WeakMap<object, DesktopElement>();

/**
 * The element of a host node. The same node always gives the same element, so
 * `event.target === ref.current` holds as it does in the DOM.
 */
export function elementFor(
  node: unknown,
  control?: ElementControl
): DesktopElement | null {
  if (!node || (typeof node !== "object" && typeof node !== "function"))
    return null;
  if (node instanceof DesktopElement) {
    if (control) node.control = control;
    return node;
  }
  let element = elements.get(node);
  if (!element) elements.set(node, (element = new DesktopElement(node)));
  if (control) element.control = control;
  return element;
}

/**
 * An element that reads and writes `control`, for a change whose host element
 * is not known yet: a native input attaches its ref on its next render, so the
 * first change can arrive before the ref is set.
 */
export function controlElement(control: ElementControl): DesktopElement {
  const element = new DesktopElement({});
  element.control = control;
  return element;
}

let focused: DesktopElement | null = null;

/** The kit element that has the keyboard focus, as `document.activeElement`. */
export function activeElement(): DesktopElement | null {
  return focused;
}

/** Called by the kit's elements as they take and lose the focus. */
export function setFocused(element: DesktopElement | null, has: boolean) {
  if (has) focused = element;
  else if (focused === element) focused = null;
}

const ids = new Map<string, DesktopElement>();

export function registerElementId(id: string, element: DesktopElement) {
  ids.set(id, element);
  return () => {
    if (ids.get(id) === element) ids.delete(id);
  };
}

/** The mounted kit element with this `id`, as `document.getElementById`. */
export function getElementById(id: string): DesktopElement | null {
  return ids.get(id) ?? null;
}
