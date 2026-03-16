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

import { mergeTests } from "@playwright/test";
import { test } from "@playwright/test";
import type { CommonFixtures, CommonWorkerFixtures } from "./common-fixtures";
import { commonFixtures } from "./common-fixtures";
import { platformTest } from "./platform-fixtures";
import { testModeTest } from "./test-mode-fixtures";

export const base = test;

export const baseTest = mergeTests(base, platformTest, testModeTest).extend<
  CommonFixtures,
  CommonWorkerFixtures
>(commonFixtures);

export function step<
  This extends NonNullable<unknown>,
  Args extends any[],
  Return
>(
  target: (this: This, ...args: Args) => Promise<Return>,
  context: ClassMethodDecoratorContext<
    This,
    (this: This, ...args: Args) => Promise<Return>
  >
) {
  function replacementMethod(this: This, ...args: Args): Promise<Return> {
    const name =
      this.constructor.name +
      "." +
      (context.name as string) +
      "(" +
      args.map((a) => JSON.stringify(a)).join(",") +
      ")";
    return test.step(name, async () => {
      return await target.call(this, ...args);
    });
  }
  return replacementMethod;
}

// declare global {
//   interface Window {
//     builtins: Builtins;
//   }
// }
