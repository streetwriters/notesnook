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

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("react-native", () => ({
  Dimensions: { get: () => ({ width: 1000, height: 800 }) }
}));

const { DesktopIntersectionObserver, installIntersectionObserver, intersectionRatio } =
  await import("./intersection-observer");

function target(top: number, height = 800) {
  const rect = { left: 0, top, width: 1000, height };
  return {
    rect,
    getBoundingClientRect: () => ({
      ...rect,
      x: rect.left,
      y: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height
    })
  } as never as { rect: typeof rect } & Parameters<
    InstanceType<typeof DesktopIntersectionObserver>["observe"]
  >[0];
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("intersectionRatio", () => {
  test("the share of the element inside the window", () => {
    const at = (top: number) =>
      intersectionRatio({ left: 0, top, width: 1000, height: 800 }, 1000, 800);
    expect(at(0)).toBe(1);
    expect(at(400)).toBe(0.5);
    expect(at(-600)).toBe(0.25);
    expect(at(800)).toBe(0);
    expect(at(5000)).toBe(0);
  });

  test("an element with no size intersects nothing", () => {
    expect(
      intersectionRatio({ left: 0, top: 0, width: 0, height: 0 }, 1000, 800)
    ).toBe(0);
  });
});

describe("DesktopIntersectionObserver", () => {
  test("reports a slide once it is half in view, as Wrapped waits for", () => {
    const seen: boolean[] = [];
    const observer = new DesktopIntersectionObserver(
      ([entry]) => seen.push(entry.isIntersecting),
      { threshold: 0.5 }
    );
    const slide = target(800);
    observer.observe(slide);
    vi.advanceTimersByTime(1);
    // First report: below the window, not intersecting.
    expect(seen).toEqual([false]);

    slide.rect.top = 700; // an eighth in view: intersects, under the threshold
    vi.advanceTimersByTime(200);
    expect(seen).toEqual([false, false]);

    slide.rect.top = 300; // more than half in view
    vi.advanceTimersByTime(200);
    expect(seen).toEqual([false, false, true]);

    // Nothing changed: nothing reported.
    vi.advanceTimersByTime(1000);
    expect(seen).toHaveLength(3);
    observer.disconnect();
  });

  test("unobserve and disconnect stop the reports and the timer", () => {
    const callback = vi.fn();
    const observer = new DesktopIntersectionObserver(callback);
    const a = target(0);
    observer.observe(a);
    observer.observe(a);
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toHaveLength(1);
    observer.unobserve(a);
    a.rect.top = 5000;
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  test("an element that cannot be measured is skipped", () => {
    const callback = vi.fn();
    const observer = new DesktopIntersectionObserver(callback);
    observer.observe({
      getBoundingClientRect() {
        throw new Error("unmounted");
      }
    } as never);
    vi.advanceTimersByTime(500);
    expect(callback).not.toHaveBeenCalled();
    observer.disconnect();
  });

  test("install defines the global only when it is missing", () => {
    const scope = globalThis as { IntersectionObserver?: unknown };
    const before = scope.IntersectionObserver;
    scope.IntersectionObserver = undefined;
    installIntersectionObserver();
    expect(scope.IntersectionObserver).toBe(DesktopIntersectionObserver);
    const other = class {};
    scope.IntersectionObserver = other;
    installIntersectionObserver();
    expect(scope.IntersectionObserver).toBe(other);
    scope.IntersectionObserver = before;
  });
});
