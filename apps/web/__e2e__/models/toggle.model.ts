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

import { Locator, Page } from "@playwright/test";
import { getTestId } from "../utils";

export enum TOGGLE_STATES {
  ON = "on",
  OFF = "off"
}

export class ToggleModel {
  private readonly toggle: Locator;
  constructor(private readonly page: Page, private readonly id: string) {
    this.toggle = page.locator(getTestId(id));
  }

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
    return await this.getToggleState(this.toggle, TOGGLE_STATES.ON).isVisible();
  }

  private async waitUntilToggleState(locator: Locator, state: TOGGLE_STATES) {
    if (this.id.startsWith("menu-button")) await this.page.waitForTimeout(200);
    else
      await this.getToggleState(locator, state).waitFor({ state: "visible" });
  }

  private getToggleState(locator: Locator, state: TOGGLE_STATES) {
    return locator.locator(getTestId(`toggle-state-${state}`));
  }

  waitFor() {
    return this.toggle.waitFor();
  }
}
