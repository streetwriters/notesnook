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

import { test } from "@nn/test";
import { gt, lt } from "semver";
import { AppModel } from "../../web/__e2e__/models/app.model.js";
import { expect } from "playwright/test";

test.extend({ options: { version: "3.0.0" } })(
  "update starts downloading if version is outdated",
  async ({ page }) => {
    await page.waitForSelector(".ProseMirror");

    await page
      .locator(".theme-scope-statusBar")
      .getByRole("button", { name: /updating/i })
      .waitFor({ state: "attached" });
  }
);

test.extend({
  options: {
    version: "3.0.0",
    config: {
      automaticUpdates: false
    }
  }
})(
  "update is only shown if version is outdated and auto updates are disabled",
  async ({ page }) => {
    await page.waitForSelector(".ProseMirror");

    const app = new AppModel(page);
    const settings = await app.goToSettings();

    await settings.checkForUpdates();
    await settings.close();

    await page
      .locator(".theme-scope-statusBar")
      .getByRole("button", { name: /available/i })
      .waitFor({ state: "attached" });
  }
);

test.extend({
  options: {
    version: "3.0.0-beta.0",
    config: {
      automaticUpdates: false,
      releaseTrack: "beta"
    }
  }
})("update to stable if it is newer", async ({ page }) => {
  await page.waitForSelector(".ProseMirror");

  const app = new AppModel(page);
  const settings = await app.goToSettings();

  await settings.checkForUpdates();
  await settings.close();

  const updateButton = page
    .locator(".theme-scope-statusBar")
    .getByRole("button", { name: /available/i });
  await updateButton.waitFor({ state: "visible" });
  const content = await updateButton.textContent();
  const version = content?.split(" ")?.[0] || "";
  expect(gt(version, "3.0.0-beta.0")).toBe(true);
});

test.extend({
  options: {
    version: "99.0.0-beta.0",
    config: {
      automaticUpdates: false,
      releaseTrack: "beta"
    }
  }
})(
  "update is not available if it latest stable version is older",
  async ({ page }) => {
    await page.waitForSelector(".ProseMirror");

    const app = new AppModel(page);
    const settings = await app.goToSettings();

    await settings.checkForUpdates();
    await settings.close();

    expect(
      await page
        .locator(".theme-scope-statusBar")
        .getByRole("button", { name: /available/i })
        .isHidden()
    ).toBe(true);
  }
);

test.extend({
  options: {
    version: "99.0.0-beta.0",
    config: { automaticUpdates: false, releaseTrack: "stable" }
  }
})(
  "downgrade to stable on switching to stable release track",
  async ({ page }) => {
    await page.waitForSelector(".ProseMirror");

    const app = new AppModel(page);
    const settings = await app.goToSettings();

    await settings.checkForUpdates();
    await settings.close();

    const updateButton = page
      .locator(".theme-scope-statusBar")
      .getByRole("button", { name: /available/i });
    await updateButton.waitFor({ state: "visible" });
    const content = await updateButton.textContent();
    const version = content?.split(" ")?.[0] || "";
    expect(lt(version, "99.0.0-beta.0")).toBe(true);
  }
);
