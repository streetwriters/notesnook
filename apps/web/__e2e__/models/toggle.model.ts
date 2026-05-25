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

import type { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";

export enum TOGGLE_STATES {
  ON = "on",
  OFF = "off"
}

export class ToggleModel {
  constructor(private readonly page: Page, private readonly toggle: Locator) {}

  async on(wait = true) {
    if (!(await this.isToggled())) {
      await this.toggle.click();
      if (wait) await this.waitUntilToggleState(this.toggle, TOGGLE_STATES.ON);
    }
  }

  async off(wait = true) {
    if (await this.isToggled()) {
      await this.toggle.click();
      if (wait) await this.waitUntilToggleState(this.toggle, TOGGLE_STATES.OFF);
    }
  }

  async isToggled() {
    return await this.getToggleState(this.toggle, TOGGLE_STATES.ON)
      .waitFor({
        state: "visible",
        timeout: 1000
      })
      .then(() => true)
      .catch(() => false);
  }

  private async waitUntilToggleState(locator: Locator, state: TOGGLE_STATES) {
    if (await this.toggle.isVisible())
      await this.getToggleState(locator, state).waitFor({ state: "visible" });
    else await this.page.waitForTimeout(200);
  }

  private getToggleState(locator: Locator, state: TOGGLE_STATES) {
    return locator.locator(getTestId(`toggle-state-${state}`));
  }

  waitFor() {
    return this.toggle.waitFor();
  }
}
