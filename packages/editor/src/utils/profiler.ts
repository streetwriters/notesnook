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

const STORAGE_KEY = "nn:profiler";
const DEFAULT_ENABLED = true;
const DEFAULT_MAX_SAMPLES = 4000;
const DEFAULT_MAX_TIMELINE = 4000;

export type ProfilerStats = {
  count: number;
  total: number;
  mean: number;
  min: number;
  max: number;
  p50: number;
  p90: number;
  p95: number;
  p99: number;
  last: number;
};

export type ProfilerEvent = {
  time: number;
  name: string;
  detail?: Record<string, unknown>;
};

export type ProfilerReport = {
  label?: string;
  startedAt: number;
  durationMs: number;
  context: Record<string, unknown>;
  timings: Record<string, ProfilerStats>;
  counters: Record<string, number>;
  gauges: Record<string, number>;
  timeline?: ProfilerEvent[];
};

export type ProfilerOptions = {
  maxSamples?: number;
  timeline?: boolean;
  maxTimeline?: number;
};

function now(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function percentile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((q / 100) * sorted.length) - 1)
  );
  return sorted[index];
}

function round(value: number, digits = 3): number {
  const factor = Math.pow(10, digits);
  return Math.round(value * factor) / factor;
}

class Series {
  private values: number[] = [];
  private cursor = 0;
  count = 0;
  total = 0;
  min = Number.POSITIVE_INFINITY;
  max = 0;
  last = 0;

  constructor(private readonly capacity: number) {}

  push(value: number): void {
    this.count++;
    this.total += value;
    this.last = value;
    if (value < this.min) this.min = value;
    if (value > this.max) this.max = value;

    if (this.values.length < this.capacity) this.values.push(value);
    else {
      this.values[this.cursor] = value;
      this.cursor = (this.cursor + 1) % this.capacity;
    }
  }

  stats(): ProfilerStats {
    const sorted = [...this.values].sort((a, b) => a - b);
    return {
      count: this.count,
      total: round(this.total),
      mean: round(this.count ? this.total / this.count : 0),
      min: round(this.count ? this.min : 0),
      max: round(this.max),
      p50: round(percentile(sorted, 50)),
      p90: round(percentile(sorted, 90)),
      p95: round(percentile(sorted, 95)),
      p99: round(percentile(sorted, 99)),
      last: round(this.last)
    };
  }
}

function readPersistedFlag(): boolean {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (value === "1") return true;
    if (value === "0") return false;
    return DEFAULT_ENABLED;
  } catch (e) {
    return DEFAULT_ENABLED;
  }
}

function persistFlag(enabled: boolean): void {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, enabled ? "1" : "0");
  } catch (e) {
    /* storage unavailable */
  }
}

export class Profiler {
  enabled = readPersistedFlag();

  private options: Required<ProfilerOptions> = {
    maxSamples: DEFAULT_MAX_SAMPLES,
    timeline: false,
    maxTimeline: DEFAULT_MAX_TIMELINE
  };
  private series = new Map<string, Series>();
  private counters = new Map<string, number>();
  private gauges = new Map<string, number>();
  private context: Record<string, unknown> = {};
  private timeline: ProfilerEvent[] = [];
  private startedAt = now();
  private snapshots = new Map<string, ProfilerReport>();

  enable(options: ProfilerOptions = {}): Profiler {
    this.options = { ...this.options, ...options };
    this.reset();
    this.enabled = true;
    persistFlag(true);
    return this;
  }

  disable(): Profiler {
    this.enabled = false;
    persistFlag(false);
    return this;
  }

  reset(): Profiler {
    this.series.clear();
    this.counters.clear();
    this.gauges.clear();
    this.timeline = [];
    this.startedAt = now();
    return this;
  }

  record(name: string, duration: number): void {
    if (!this.enabled || !Number.isFinite(duration)) return;
    let series = this.series.get(name);
    if (!series) {
      series = new Series(this.options.maxSamples);
      this.series.set(name, series);
    }
    series.push(duration);
    if (this.options.timeline) this.event(name, { ms: round(duration) });
  }

  count(name: string, delta = 1): void {
    if (!this.enabled) return;
    this.counters.set(name, (this.counters.get(name) ?? 0) + delta);
  }

  gauge(name: string, value: number): void {
    if (!this.enabled || !Number.isFinite(value)) return;
    this.gauges.set(name, value);
  }

  setContext(key: string, value: unknown): void {
    this.context[key] = value;
  }

  event(name: string, detail?: Record<string, unknown>): void {
    if (!this.enabled || !this.options.timeline) return;
    if (this.timeline.length >= this.options.maxTimeline) this.timeline.shift();
    this.timeline.push({ time: round(now() - this.startedAt), name, detail });
  }

  time<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();
    const start = now();
    try {
      return fn();
    } finally {
      this.record(name, now() - start);
    }
  }

  start(name: string): () => void {
    if (!this.enabled) return () => undefined;
    const start = now();
    return () => this.record(name, now() - start);
  }

  stats(name: string): ProfilerStats | undefined {
    return this.series.get(name)?.stats();
  }

  report(label?: string): ProfilerReport {
    const timings: Record<string, ProfilerStats> = {};
    for (const [name, series] of [...this.series.entries()].sort())
      timings[name] = series.stats();

    return {
      label,
      startedAt: round(this.startedAt),
      durationMs: round(now() - this.startedAt),
      context: { ...this.context },
      timings,
      counters: Object.fromEntries([...this.counters.entries()].sort()),
      gauges: Object.fromEntries([...this.gauges.entries()].sort()),
      timeline: this.options.timeline ? [...this.timeline] : undefined
    };
  }

  snapshot(label: string): ProfilerReport {
    const report = this.report(label);
    this.snapshots.set(label, report);
    return report;
  }

  getSnapshot(label: string): ProfilerReport | undefined {
    return this.snapshots.get(label);
  }

  listSnapshots(): string[] {
    return [...this.snapshots.keys()];
  }

  print(label?: string): ProfilerReport {
    const report = this.report(label);
    const rows: Record<string, ProfilerStats> = {};
    for (const [name, stats] of Object.entries(report.timings).sort(
      (a, b) => b[1].total - a[1].total
    ))
      rows[name] = stats;

    console.group(
      `editor profile${label ? ` · ${label}` : ""} · ${round(
        report.durationMs / 1000,
        1
      )}s`
    );
    console.table(report.context);
    console.table(rows);
    console.table(report.gauges);
    console.table(report.counters);
    console.groupEnd();
    return report;
  }

  compare(baseline: string, candidate: string): void {
    const a = this.snapshots.get(baseline);
    const b = this.snapshots.get(candidate);
    if (!a || !b) {
      console.warn(
        `missing snapshot: ${!a ? baseline : candidate}. available: ${
          this.listSnapshots().join(", ") || "none"
        }`
      );
      return;
    }

    const names = [
      ...new Set([...Object.keys(a.timings), ...Object.keys(b.timings)])
    ].sort();
    const rows: Record<string, Record<string, number | string>> = {};
    for (const name of names) {
      const left = a.timings[name];
      const right = b.timings[name];
      const meanDelta =
        left && right && left.mean > 0
          ? `${round(((right.mean - left.mean) / left.mean) * 100, 1)}%`
          : "-";
      const totalDelta =
        left && right && left.total > 0
          ? `${round(((right.total - left.total) / left.total) * 100, 1)}%`
          : "-";
      rows[name] = {
        [`${baseline} mean`]: left?.mean ?? 0,
        [`${candidate} mean`]: right?.mean ?? 0,
        "mean Δ": meanDelta,
        [`${baseline} p95`]: left?.p95 ?? 0,
        [`${candidate} p95`]: right?.p95 ?? 0,
        [`${baseline} total`]: left?.total ?? 0,
        [`${candidate} total`]: right?.total ?? 0,
        "total Δ": totalDelta
      };
    }

    console.group(`editor profile · ${baseline} → ${candidate}`);
    console.table(rows);
    console.groupEnd();
  }
}

export const profiler = new Profiler();
