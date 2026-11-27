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

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { showToast, useToasts } from "./toast";

// The icons are drawn by the app's icon package, which the node tests can't load.
vi.mock("../shared/icons", () => ({
  Error: () => null,
  Success: () => null,
  Warn: () => null,
  Info: () => null
}));

// apps/web shows toasts with react-hot-toast and `id: message`, so the kit
// keys its toasts by message the same way. These tests pin that behaviour.
const shown = () =>
  useToasts.getState().entries.map((entry) => `${entry.type}:${entry.message}`);

describe("web kit toasts, keyed by message as apps/web", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useToasts.setState({ entries: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    useToasts.setState({ entries: [] });
  });

  it("shows an equal message once, with the newest type", () => {
    showToast("info", "Saved", undefined, 0);
    showToast("error", "Saved", undefined, 0);

    expect(shown()).toEqual(["error:Saved"]);
  });

  it("hides the newer toast when a stale handle with the same message is hidden", () => {
    const first = showToast("info", "Syncing", undefined, 0);
    showToast("info", "Syncing", undefined, 0);

    first.hide();

    expect(shown()).toEqual([]);
  });

  it("leaves toasts with other messages alone when a handle is hidden", () => {
    const first = showToast("info", "A", undefined, 0);
    showToast("info", "B", undefined, 0);

    first.hide();

    expect(shown()).toEqual(["info:B"]);
  });

  it("restarts the timer when an equal message replaces the toast", () => {
    showToast("info", "Again", undefined, 1000);
    vi.advanceTimersByTime(800);
    showToast("info", "Again", undefined, 1000);

    vi.advanceTimersByTime(800);
    expect(shown()).toEqual(["info:Again"]);

    vi.advanceTimersByTime(200);
    expect(shown()).toEqual([]);
  });

  it("hides the toast after hideAfter", () => {
    showToast("success", "Done", undefined, 1000);

    vi.advanceTimersByTime(999);
    expect(shown()).toEqual(["success:Done"]);

    vi.advanceTimersByTime(1);
    expect(shown()).toEqual([]);
  });
});
