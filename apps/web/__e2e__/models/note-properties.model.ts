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
import { downloadAndReadFile, getTestId } from "../utils";
import { ContextMenuModel } from "./context-menu.model";
import { ToggleModel } from "./toggle.model";
import { Notebook } from "./types";
import { fillPasswordDialog, iterateList } from "./utils";

abstract class BaseProperties {
  protected readonly page: Page;

  private readonly pinToggle: ToggleModel;
  private readonly favoriteToggle: ToggleModel;
  private readonly lockToggle: ToggleModel;

  constructor(
    page: Page,
    protected readonly noteLocator: Locator,
    private readonly itemPrefix: string
  ) {
    this.page = page;
    this.pinToggle = new ToggleModel(page, `${itemPrefix}-pin`);
    this.lockToggle = new ToggleModel(page, `${itemPrefix}-lock`);
    this.favoriteToggle = new ToggleModel(page, `${itemPrefix}-favorite`);
  }

  async isPinned() {
    await this.open();
    const state = await this.pinToggle.isToggled();
    await this.close();
    return state;
  }

  async pin() {
    await this.open();
    await this.pinToggle.on();
    await this.close();
  }

  async unpin() {
    await this.open();
    await this.pinToggle.off();
    await this.close();
  }

  async lock(password: string) {
    await this.open();
    await this.lockToggle.on(false);
    await fillPasswordDialog(this.page, password);
    await this.noteLocator
      .locator(getTestId("locked"))
      .waitFor({ state: "visible" });
  }

  async unlock(password: string) {
    await this.open();
    await this.lockToggle.off(false);

    await fillPasswordDialog(this.page, password);

    await this.noteLocator
      .locator(getTestId("locked"))
      .waitFor({ state: "hidden" });
  }

  async isLocked() {
    return (
      (await this.noteLocator.locator(getTestId("locked")).isVisible()) &&
      (await this.noteLocator.locator(getTestId(`description`)).isHidden()) &&
      (await (async () => {
        await this.noteLocator.click();
        return await this.page
          .locator(getTestId("unlock-note-title"))
          .isVisible();
      })()) &&
      (await (async () => {
        await this.open();
        const state = await this.lockToggle.isToggled();
        await this.close();
        return state;
      })())
    );
  }

  async isFavorited() {
    await this.open();
    const state = await this.favoriteToggle.isToggled();
    await this.close();
    return state;
  }

  async favorite() {
    await this.open();
    await this.favoriteToggle.on();
    await this.close();
  }

  async unfavorite() {
    await this.open();
    await this.favoriteToggle.off();
    await this.close();
  }

  abstract isColored(color: string): Promise<boolean>;
  abstract color(color: string): Promise<void>;
  abstract open(): Promise<void>;
  abstract close(): Promise<void>;
}

export class NotePropertiesModel extends BaseProperties {
  private readonly propertiesButton: Locator;
  private readonly propertiesCloseButton: Locator;
  private readonly readonlyToggle: ToggleModel;
  private readonly sessionItems: Locator;

  constructor(page: Page, noteLocator: Locator) {
    super(page, noteLocator, "properties");
    this.propertiesButton = page.locator(getTestId("Properties"));
    this.propertiesCloseButton = page.locator(getTestId("properties-close"));
    this.readonlyToggle = new ToggleModel(page, `properties-readonly`);
    this.sessionItems = page.locator(getTestId("session-item"));
  }

  async isColored(color: string): Promise<boolean> {
    await this.open();
    const state = await new ToggleModel(
      this.page,
      `properties-${color}`
    ).isToggled();
    await this.close();
    return state;
  }

  async color(color: string) {
    await this.open();
    await new ToggleModel(this.page, `properties-${color}`).on();
    await this.close();
  }

  async isReadonly() {
    await this.open();
    const state = await this.readonlyToggle.isToggled();
    await this.close();
    return state;
  }

  async readonly() {
    await this.open();
    await this.readonlyToggle.on();
    await this.close();
  }

  async editable() {
    await this.open();
    await this.readonlyToggle.off();
    await this.close();
  }

  async open() {
    await this.propertiesButton.click();
    await this.propertiesCloseButton.waitFor();
    await this.page.waitForTimeout(1000);
  }

  async close() {
    await this.propertiesCloseButton.click();
  }

  async getSessionHistory() {
    await this.open();
    await this.sessionItems.first().waitFor();

    const history: SessionHistoryItemModel[] = [];
    for await (const item of iterateList(this.sessionItems)) {
      history.push(new SessionHistoryItemModel(this, item));
    }
    await this.close();
    return history;
  }
}

export class NoteContextMenuModel extends BaseProperties {
  private readonly menu: ContextMenuModel;
  constructor(page: Page, noteLocator: Locator) {
    super(page, noteLocator, "menuitem");
    this.menu = new ContextMenuModel(page);
  }

  async isColored(color: string): Promise<boolean> {
    await this.open();
    await this.menu.clickOnItem("colors");
    const state = await new ToggleModel(
      this.page,
      `menuitem-${color}`
    ).isToggled();
    await this.close();
    return state;
  }

  async color(color: string) {
    await this.open();
    await this.menu.clickOnItem("colors");
    await new ToggleModel(this.page, `menuitem-${color}`).on();
    await this.close();
  }

  async moveToTrash() {
    await this.open();
    await Promise.all([
      this.menu.clickOnItem("movetotrash"),
      this.noteLocator.waitFor({ state: "detached" })
    ]);
  }

  async export(format: "html" | "md" | "txt") {
    await this.open();
    await this.menu.clickOnItem("export");

    // we need to override date time so
    // date created & date edited remain fixed.
    await this.noteLocator.evaluate(() => {
      // eslint-disable-next-line no-extend-native
      Date.prototype.toLocaleString = () => "xxx";
    });

    return await downloadAndReadFile(
      this.noteLocator.page(),
      this.menu.getItem(format),
      "utf-8"
    );
  }

  async addToNotebook(notebook: Notebook) {
    await this.open();

    await this.menu.clickOnItem("notebooks");
    await this.menu.clickOnItem("link-notebooks");

    const filterInput = this.page.locator(getTestId("filter-input"));
    await filterInput.type(notebook.title);
    await filterInput.press("Enter");

    await this.page.waitForSelector(getTestId("notebook"), {
      state: "visible",
      strict: false
    });

    const notebookItems = this.page.locator(getTestId("notebook"));
    for await (const item of iterateList(notebookItems)) {
      await item.locator(getTestId("notebook-tools")).click();
      const title = item.locator(getTestId("notebook-title"));
      const createTopicButton = item.locator(getTestId("create-topic"));
      const notebookTitle = await title.textContent();

      if (notebookTitle?.includes(notebook.title)) {
        for (const topic of notebook.topics) {
          await createTopicButton.click();
          const newItemInput = item.locator(getTestId("new-topic-input"));

          await newItemInput.waitFor({ state: "visible" });
          await newItemInput.fill(topic);
          await newItemInput.press("Enter");

          await item.locator(getTestId("topic"), { hasText: topic }).waitFor();
        }

        const topicItems = item.locator(getTestId("topic"));
        for await (const topicItem of iterateList(topicItems)) {
          await this.page.keyboard.down("Control");
          await topicItem.click();
          await this.page.keyboard.up("Control");
        }
      }
    }

    const dialogConfirm = this.page.locator(getTestId("dialog-yes"));
    await dialogConfirm.click();
    await dialogConfirm.waitFor({ state: "detached" });
  }

  async open() {
    await this.menu.open(this.noteLocator);
  }

  async close() {
    await this.menu.close();
  }
}

class SessionHistoryItemModel {
  private readonly title: Locator;
  private readonly page: Page;
  private readonly previewNotice: Locator;
  private readonly locked: Locator;
  constructor(
    private readonly properties: NotePropertiesModel,
    private readonly locator: Locator
  ) {
    this.page = locator.page();
    this.title = locator.locator(getTestId("title"));
    this.previewNotice = this.page.locator(getTestId("preview-notice"));
    this.locked = locator.locator(getTestId("locked"));
  }

  async getTitle() {
    return await this.title.textContent();
  }

  async preview(password?: string) {
    await this.properties.open();
    const isLocked = await this.locked.isVisible();
    await this.locator.click();
    if (password && isLocked) {
      await fillPasswordDialog(this.page, password);
    }
    await this.previewNotice.waitFor();
  }

  async isLocked() {
    await this.properties.open();
    const state = await this.locked.isVisible();
    await this.properties.close();
    return state;
  }
}
