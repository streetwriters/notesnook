import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { createMigrationOverlay } from "./migration-overlay";

describe("migration overlay", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test("a migration that finishes quickly never shows the overlay", () => {
    const changes: boolean[] = [];
    const overlay = createMigrationOverlay((visible) => changes.push(visible));
    overlay.start();
    vi.advanceTimersByTime(299);
    expect(changes).toEqual([]);
    overlay.finish();
    vi.advanceTimersByTime(1000);
    expect(changes).toEqual([false]);
  });

  test("a migration that lasts shows the overlay and hides it when finished", () => {
    const changes: boolean[] = [];
    const overlay = createMigrationOverlay((visible) => changes.push(visible));
    overlay.start();
    vi.advanceTimersByTime(300);
    expect(changes).toEqual([true]);
    overlay.finish();
    expect(changes).toEqual([true, false]);
  });

  test("disposing cancels a pending show", () => {
    const changes: boolean[] = [];
    const overlay = createMigrationOverlay((visible) => changes.push(visible));
    overlay.start();
    overlay.dispose();
    vi.advanceTimersByTime(1000);
    expect(changes).toEqual([]);
  });
});
