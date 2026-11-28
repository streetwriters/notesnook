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

// The DOM's IntersectionObserver for kit elements, for files shared with
// apps/web that reveal content as it scrolls into view. The platform reports
// no intersections, so observed elements are measured on a timer against the
// window (there is no `root` other than the viewport), and the callback runs
// when an element starts or stops intersecting or crosses a threshold, as in
// the DOM.

import { Dimensions } from "react-native";
import type { UIElement, UIRect } from "../contracts/elements";

export interface IntersectionEntry {
  target: UIElement;
  isIntersecting: boolean;
  intersectionRatio: number;
  boundingClientRect: UIRect;
  time: number;
}

type Callback = (
  entries: IntersectionEntry[],
  observer: DesktopIntersectionObserver
) => void;

interface Options {
  threshold?: number | number[];
  root?: unknown;
  rootMargin?: string;
}

const POLL_MS = 150;

/** The share of `rect` inside a `width` by `height` viewport, 0 to 1. */
export function intersectionRatio(
  rect: Pick<UIRect, "left" | "top" | "width" | "height">,
  width: number,
  height: number
) {
  const area = rect.width * rect.height;
  if (!(area > 0)) return 0;
  const x = Math.min(rect.left + rect.width, width) - Math.max(rect.left, 0);
  const y = Math.min(rect.top + rect.height, height) - Math.max(rect.top, 0);
  if (x <= 0 || y <= 0) return 0;
  return Math.min(1, (x * y) / area);
}

export class DesktopIntersectionObserver {
  readonly thresholds: number[];
  private targets = new Map<UIElement, string | undefined>();
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor(private callback: Callback, options: Options = {}) {
    const threshold = options.threshold ?? 0;
    this.thresholds = (Array.isArray(threshold) ? threshold : [threshold])
      .slice()
      .sort((a, b) => a - b);
  }

  observe(target: UIElement) {
    if (!target || this.targets.has(target)) return;
    this.targets.set(target, undefined);
    this.timer ??= setInterval(() => this.check(), POLL_MS);
    // The DOM reports each new target once, soon after it is observed.
    setTimeout(() => this.check(), 0);
  }

  unobserve(target: UIElement) {
    this.targets.delete(target);
    if (this.targets.size === 0) this.stop();
  }

  disconnect() {
    this.targets.clear();
    this.stop();
  }

  takeRecords(): IntersectionEntry[] {
    return [];
  }

  private stop() {
    if (this.timer !== undefined) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Measures every target and reports the ones whose state changed. */
  check() {
    const { width, height } = Dimensions.get("window");
    const entries: IntersectionEntry[] = [];
    for (const [target, before] of this.targets) {
      let rect: UIRect;
      try {
        rect = target.getBoundingClientRect();
      } catch {
        continue;
      }
      const ratio = intersectionRatio(rect, width, height);
      const isIntersecting = ratio > 0;
      const crossed = this.thresholds.filter((t) => ratio >= t).length;
      const state = `${isIntersecting}/${crossed}`;
      if (state === before) continue;
      this.targets.set(target, state);
      entries.push({
        target,
        // As in the DOM, a target counts as intersecting only once it has
        // reached the first threshold.
        isIntersecting: isIntersecting && crossed > 0,
        intersectionRatio: ratio,
        boundingClientRect: rect,
        time: Date.now()
      });
    }
    if (entries.length) this.callback(entries, this);
  }
}

/** Defines `IntersectionObserver` globally when the platform has none. */
export function installIntersectionObserver() {
  const scope = globalThis as { IntersectionObserver?: unknown };
  scope.IntersectionObserver ??= DesktopIntersectionObserver;
}
