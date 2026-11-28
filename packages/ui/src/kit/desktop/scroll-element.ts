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

import type { UIElement, UIRect } from "../contracts/elements";
import type { UISyntheticEvent } from "../contracts/events";

/** What the scroll view last reported: its offset, content and viewport. */
export type ScrollMetrics = {
  top: number;
  left: number;
  contentWidth: number;
  contentHeight: number;
  width: number;
  height: number;
  x: number;
  y: number;
};

/** The part of a native scroll view the element needs; all of it optional. */
export type NativeScrollNode = {
  scrollTo?: (options: { x?: number; y?: number; animated?: boolean }) => void;
  focus?: () => void;
  blur?: () => void;
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void
  ) => void;
  getBoundingClientRect?: () => {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

export function emptyScrollMetrics(): ScrollMetrics {
  return {
    top: 0,
    left: 0,
    contentWidth: 0,
    contentHeight: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0
  };
}

function rect(x: number, y: number, width: number, height: number): UIRect {
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

/**
 * The element a `ScrollContainer` ref gives: the DOM's scrolling members on a
 * native scroll view. Positions are read from `metrics`, which the container
 * keeps current from the scroll view's events; writing `scrollTop` or
 * `scrollLeft`, or calling `scrollTo`, scrolls the view at once.
 */
export function createScrollElement(
  node: () => NativeScrollNode | null | undefined,
  metrics: ScrollMetrics
): UIElement {
  const scroll = (
    target: { top?: number; left?: number },
    animated: boolean
  ) => {
    const maxTop = Math.max(0, metrics.contentHeight - metrics.height);
    const maxLeft = Math.max(0, metrics.contentWidth - metrics.width);
    // Before the first layout the sizes are unknown: don't clamp to zero then.
    const known = metrics.contentHeight > 0 || metrics.contentWidth > 0;
    const top = Math.max(0, target.top ?? metrics.top);
    const left = Math.max(0, target.left ?? metrics.left);
    metrics.top = known ? Math.min(top, maxTop) : top;
    metrics.left = known ? Math.min(left, maxLeft) : left;
    node()?.scrollTo?.({ x: metrics.left, y: metrics.top, animated });
  };

  const element: UIElement & {
    measureInWindow: (
      callback: (x: number, y: number, width: number, height: number) => void
    ) => void;
  } = {
    focus: () => node()?.focus?.(),
    blur: () => node()?.blur?.(),
    click: () => node()?.focus?.(),
    classList: {
      add: () => undefined,
      remove: () => undefined,
      contains: () => false,
      toggle: (_name, force) => !!force
    },
    getBoundingClientRect: () => {
      const native = node()?.getBoundingClientRect?.();
      if (native) return rect(native.x, native.y, native.width, native.height);
      return rect(metrics.x, metrics.y, metrics.width, metrics.height);
    },
    scrollIntoView: () => {},
    scrollTo: (options) =>
      scroll(
        { top: options.top, left: options.left },
        options.behavior === "smooth"
      ),
    contains: (other) => other === element,
    get scrollTop() {
      return metrics.top;
    },
    set scrollTop(value: number) {
      scroll({ top: value }, false);
    },
    get scrollLeft() {
      return metrics.left;
    },
    set scrollLeft(value: number) {
      scroll({ left: value }, false);
    },
    get scrollHeight() {
      return Math.max(metrics.contentHeight, metrics.height);
    },
    get scrollWidth() {
      return Math.max(metrics.contentWidth, metrics.width);
    },
    get clientHeight() {
      return metrics.height;
    },
    get clientWidth() {
      return metrics.width;
    },
    get offsetHeight() {
      return metrics.height;
    },
    get offsetWidth() {
      return metrics.width;
    },
    get offsetTop() {
      return metrics.y;
    },
    get offsetLeft() {
      return metrics.x;
    },
    measureInWindow: (callback) => {
      const native = node();
      if (native?.measureInWindow) native.measureInWindow(callback);
      else callback(metrics.x, metrics.y, metrics.width, metrics.height);
    }
  };
  return element;
}

/** A DOM-shaped event whose `target` and `currentTarget` are `element`. */
export function syntheticEvent<T extends object>(
  element: UIElement,
  extra?: T
): UISyntheticEvent & T {
  return {
    ...(extra as T),
    target: element,
    currentTarget: element,
    preventDefault: () => {},
    stopPropagation: () => {}
  };
}
