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

import { describe, expect, it, vi } from "vitest";

const openUrl = vi.fn();
vi.mock("@platform", () => ({ shell: { openUrl } }));

const { installWebGlobals } = await import("./web-globals");

describe("web globals", () => {
  it("window.open opens the link in the browser", () => {
    const scope: {
      window?: { open?: (url?: string, target?: string) => null };
    } = {};
    installWebGlobals(scope);
    expect(scope.window?.open?.("https://notesnook.com", "_blank")).toBe(null);
    expect(openUrl).toHaveBeenCalledWith("https://notesnook.com");
  });

  it("keeps a window.open that is already there", () => {
    const open = vi.fn();
    const scope = { window: { open } };
    installWebGlobals(scope);
    expect(scope.window.open).toBe(open);
  });
});
