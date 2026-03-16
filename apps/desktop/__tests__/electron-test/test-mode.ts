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
/* eslint-disable @typescript-eslint/ban-ts-comment */

// @ts-ignore
import { start } from "playwright-core/lib/outofprocess";
// @ts-ignore
import type { Playwright } from "playwright-core/lib/client/playwright";

export type TestModeName =
  | "default"
  | "driver"
  | "service"
  | "service2"
  | "wsl";

interface TestMode {
  setup(): Promise<Playwright>;
  teardown(): Promise<void>;
}

export class DriverTestMode implements TestMode {
  private _impl: { playwright: Playwright; stop: () => Promise<void> };

  async setup() {
    this._impl = await start({
      NODE_OPTIONS: undefined // Hide driver process while debugging.
    });
    return this._impl.playwright;
  }

  async teardown() {
    await this._impl.stop();
  }
}

export class DefaultTestMode implements TestMode {
  async setup() {
    return require("playwright-core");
  }

  async teardown() {}
}
