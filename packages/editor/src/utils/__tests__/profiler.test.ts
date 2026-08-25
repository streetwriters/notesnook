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

import { beforeEach, describe, expect, test } from "vitest";
import { Profiler } from "../profiler.js";

let profiler: Profiler;

beforeEach(() => {
  globalThis.localStorage?.clear();
  profiler = new Profiler();
  profiler.enable();
});

describe("profiler", () => {
  test("is enabled by default", () => {
    globalThis.localStorage?.clear();
    expect(new Profiler().enabled).toBe(true);
  });

  test("stays disabled across reloads once turned off", () => {
    globalThis.localStorage?.clear();
    new Profiler().disable();
    expect(new Profiler().enabled).toBe(false);
  });

  test("records nothing while disabled", () => {
    profiler.disable();
    profiler.record("a", 10);
    profiler.count("c");
    profiler.gauge("g", 1);

    const report = profiler.report();
    expect(report.timings).toEqual({});
    expect(report.counters).toEqual({});
    expect(report.gauges).toEqual({});
  });

  test("time() still runs the function while disabled", () => {
    profiler.disable();
    expect(profiler.time("a", () => 42)).toBe(42);
    expect(profiler.stats("a")).toBeUndefined();
  });

  test("time() records the function's duration and returns its value", () => {
    expect(profiler.time("a", () => 42)).toBe(42);
    expect(profiler.stats("a")?.count).toBe(1);
  });

  test("time() records even when the function throws", () => {
    expect(() =>
      profiler.time("a", () => {
        throw new Error("boom");
      })
    ).toThrow("boom");
    expect(profiler.stats("a")?.count).toBe(1);
  });

  test("computes summary statistics", () => {
    for (const value of [1, 2, 3, 4, 5, 6, 7, 8, 9, 100])
      profiler.record("a", value);

    const stats = profiler.stats("a");
    expect(stats).toMatchObject({
      count: 10,
      total: 145,
      mean: 14.5,
      min: 1,
      max: 100,
      p50: 5,
      p90: 9,
      last: 100
    });
  });

  test("counters accumulate and gauges hold the latest value", () => {
    profiler.count("hits");
    profiler.count("hits", 4);
    profiler.gauge("blocks", 100);
    profiler.gauge("blocks", 250);

    const report = profiler.report();
    expect(report.counters.hits).toBe(5);
    expect(report.gauges.blocks).toBe(250);
  });

  test("keeps cumulative count/total beyond the sample window", () => {
    profiler.enable({ maxSamples: 10 });
    for (let i = 0; i < 100; i++) profiler.record("a", 2);

    const stats = profiler.stats("a");
    expect(stats?.count).toBe(100);
    expect(stats?.total).toBe(200);
    expect(stats?.p50).toBe(2);
  });

  test("start() returns an end function that records once", () => {
    const end = profiler.start("a");
    end();
    expect(profiler.stats("a")?.count).toBe(1);
  });

  test("reset clears samples but keeps context", () => {
    profiler.setContext("virtualization", true);
    profiler.record("a", 1);
    profiler.reset();

    const report = profiler.report();
    expect(report.timings).toEqual({});
    expect(report.context).toEqual({ virtualization: true });
  });

  test("timeline is only collected when requested", () => {
    profiler.record("a", 1);
    expect(profiler.report().timeline).toBeUndefined();

    profiler.enable({ timeline: true });
    profiler.event("loaded", { blocks: 10 });
    profiler.record("a", 1);

    const timeline = profiler.report().timeline;
    expect(timeline?.map((e) => e.name)).toEqual(["loaded", "a"]);
  });

  test("snapshots are retained across resets", () => {
    profiler.record("a", 5);
    profiler.snapshot("virtualization-off");
    profiler.reset();
    profiler.record("a", 1);
    profiler.snapshot("virtualization-on");

    expect(profiler.listSnapshots()).toEqual([
      "virtualization-off",
      "virtualization-on"
    ]);
    expect(profiler.getSnapshot("virtualization-off")?.timings.a.mean).toBe(5);
    expect(profiler.getSnapshot("virtualization-on")?.timings.a.mean).toBe(1);
  });
});
