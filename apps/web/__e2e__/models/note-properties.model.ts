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
import { Color, Notebook } from "./types";
import {
  confirmDialog,
  fillColorDialog,
  fillNotebookDialog,
  fillPasswordDialog,
  iterateList
} from "./utils";
import { ZipReader, TextWriter, Uint8ArrayReader } from "@zip.js/zip.js";
import { SessionHistoryItemModel } from "./session-history-item-model";

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
      // (await (async () => {
      //   await this.noteLocator.click();
      //   return await this.page
      //     .locator(getTestId("unlock-note-title"))
      //     .isVisible();
      // })()) &&
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
    super(page, noteLocator, "menu-button");
    this.menu = new ContextMenuModel(page);
  }

  async isColored(color: string): Promise<boolean> {
    await this.open();
    await this.menu.clickOnItem("colors");
    const state = await new ToggleModel(
      this.page,
      `menu-button-${color}`
    ).isToggled();
    await this.close();
    return state;
  }

  async color(color: string) {
    await this.open();
    await this.menu.clickOnItem("colors");
    await new ToggleModel(this.page, `menu-button-${color}`).on();
    await this.close();
  }

  async uncolor(color: string) {
    await this.open();
    await this.menu.clickOnItem("colors");
    await new ToggleModel(this.page, `menu-button-${color}`).off();
    await this.close();
  }

  async newColor(color: Color) {
    await this.open();
    await this.menu.clickOnItem("colors");
    await new ToggleModel(this.page, `menu-button-new-color`).on();
    await fillColorDialog(this.page, color);
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

    const zip = await downloadAndReadFile(
      this.noteLocator.page(),
      () => this.menu.getItem(format).click(),
      null
    );

    const entries = await new ZipReader(
      new Uint8ArrayReader(new Uint8Array(zip as Buffer))
    ).getEntries();
    const writer = new TextWriter();
    await entries[0].getData?.(writer);
    const content = await writer.getData();

    if (format === "html") {
      return content
        .replace(/(name="created-at" content=")(.+?)"/, '$1xxx"')
        .replace(/(name="updated-at" content=")(.+?)"/, '$1xxx"')
        .replace(/(data-block-id=")(.+?)"/gm, '$1xxx"');
    }
    return content;
  }

  async addToNotebook(notebook: Notebook) {
    async function addSubNotebooks(
      page: Page,
      dialog: Locator,
      item: Locator,
      notebook: Notebook
    ) {
      if (notebook.subNotebooks) {
        const addSubNotebookButton = item.locator(
          getTestId("add-sub-notebook")
        );
        for (const subNotebook of notebook.subNotebooks) {
          await addSubNotebookButton.click();

          await fillNotebookDialog(page, subNotebook);

          const subNotebookItem = dialog.locator(getTestId("notebook"), {
            hasText: subNotebook.title
          });
          await subNotebookItem.waitFor();

          await page.keyboard.down("Control");
          await subNotebookItem.click();
          await page.keyboard.up("Control");

          await addSubNotebooks(page, dialog, subNotebookItem, subNotebook);
        }
      }
    }

    await this.open();

    await this.menu.clickOnItem("notebooks");
    await this.menu.clickOnItem("link-notebooks");

    const dialog = this.page.locator(getTestId("move-note-dialog"));

    await dialog.locator(getTestId("add-new-notebook")).click();

    await fillNotebookDialog(this.page, notebook);

    const notebookItem = dialog.locator(getTestId("notebook"), {
      hasText: notebook.title
    });

    await notebookItem.waitFor({ state: "visible" });

    await this.page.keyboard.down("Control");
    await notebookItem.click();
    await this.page.keyboard.up("Control");

    await addSubNotebooks(this.page, dialog, notebookItem, notebook);

    await confirmDialog(dialog);
  }

  async open() {
    await this.menu.open(this.noteLocator);
  }

  async close() {
    await this.menu.close();
  }

  title() {
    return this.menu.title();
  }
}
