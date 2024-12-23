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
import { TabItemModel } from "./tab-item.model";
import { iterateList } from "./utils";

export class EditorModel {
  private readonly page: Page;
  private readonly title: Locator;
  readonly content: Locator;
  private readonly tags: Locator;
  private readonly tagInput: Locator;
  private readonly focusModeButton: Locator;
  private readonly normalModeButton: Locator;
  private readonly enterFullscreenButton: Locator;
  private readonly exitFullscreenButton: Locator;
  private readonly wordCountText: Locator;
  private readonly dateEditedText: Locator;
  private readonly searchButton: Locator;
  private readonly tabsList: Locator;
  readonly savedIcon: Locator;
  readonly notSavedIcon: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator(".active").locator(getTestId("editor-title"));
    this.content = page.locator(".active").locator(".ProseMirror");
    this.tagInput = page
      .locator(".active")
      .locator(getTestId("editor-tag-input"));
    this.tags = page
      .locator(".active")
      .locator(`${getTestId("tags")} >> ${getTestId("tag")}`);
    this.focusModeButton = page.locator(getTestId("Focus mode"));
    this.normalModeButton = page.locator(getTestId("Normal mode"));
    this.enterFullscreenButton = page.locator(getTestId("Enter fullscreen"));
    this.exitFullscreenButton = page.locator(getTestId("Exit fullscreen"));
    this.wordCountText = page.locator(getTestId("editor-word-count"));
    this.dateEditedText = page.locator(getTestId("editor-date-edited"));
    this.searchButton = page.locator(getTestId("Search"));
    this.savedIcon = page.locator(getTestId("editor-save-state-saved"));
    this.notSavedIcon = page.locator(getTestId("editor-save-state-notsaved"));
    this.tabsList = page.locator(getTestId("tabs"));
  }

  async waitForLoading(title?: string, content?: string) {
    await this.title.waitFor();

    await this.page.waitForFunction(
      ({ expected }) => {
        const titleInput = document.querySelector(
          `.active [data-test-id="editor-title"]`
        ) as HTMLInputElement | null;
        if (titleInput)
          return expected !== undefined
            ? titleInput.value === expected
            : titleInput.value.length > 0;
        return false;
      },
      { expected: title }
    );

    if (content !== undefined)
      await this.content.locator(":scope", { hasText: content }).waitFor();
  }

  async waitForUnloading() {
    await this.page.waitForURL(/#\/notes\/?.+\/create/gm);
    await this.searchButton.isDisabled();
    await this.page
      .locator(".active")
      .locator(getTestId("tags"))
      .waitFor({ state: "hidden" });
    await this.dateEditedText.waitFor({ state: "hidden" });
    await this.wordCountText.waitFor();
    await this.waitForLoading("", "");
  }

  async waitForSaving() {
    await this.page.waitForURL(/#\/notes\/?.+\/edit/gm);
    await this.page.locator(".active").locator(getTestId("tags")).waitFor();
    await this.searchButton.waitFor();
    await this.wordCountText.waitFor();
  }

  async isUnloaded() {
    return (
      (await this.tagInput.isHidden()) &&
      (await this.enterFullscreenButton.isHidden()) &&
      (await this.dateEditedText.isHidden())
    );
  }

  async setTitle(text: string) {
    await this.editAndWait(async () => {
      await this.title.fill(text);
    });
  }

  async typeTitle(text: string, delay = 0) {
    await this.editAndWait(async () => {
      await this.title.focus();
      await this.title.press("End");
      await this.title.type(text, { delay });
    });
  }

  async setContent(text: string) {
    await this.editAndWait(async () => {
      await this.content.focus();
      await this.content.pressSequentially(text);
    });
  }

  async clear() {
    await this.editAndWait(async () => {
      await this.selectAll();
      await this.content.press("Backspace");
    });
  }

  async editAndWait(action: () => Promise<void>) {
    const oldDateEdited = await this.getDateEdited();
    await action();
    await this.page.waitForFunction(
      ({ oldDateEdited }) => {
        const dateEditedText = document.querySelector(
          `[data-test-id="editor-date-edited"]`
        );
        const timestampText = dateEditedText?.getAttribute("title");
        if (!timestampText) return false;
        const timestamp = parseInt(timestampText);
        return timestamp > oldDateEdited;
      },
      { oldDateEdited }
    );
  }

  async getDateEdited() {
    if (await this.dateEditedText.isHidden()) return 0;

    const timestamp = await this.dateEditedText.getAttribute("title");
    if (timestamp) return parseInt(timestamp);
    return 0;
  }

  async selectAll() {
    await this.content.focus();
    await this.page.keyboard.press("Control+a");
    await this.page.waitForTimeout(500);
  }

  async setTags(tags: string[]) {
    for (const tag of tags) {
      await this.tagInput.focus();
      await this.tagInput.fill(tag);
      await this.tagInput.press("Enter");
      await this.tags
        .locator("span", { hasText: new RegExp(`^${tag}$`) })
        .waitFor();
    }
  }

  async getTags() {
    const tags: string[] = [];
    const count = await this.tags.count();
    for (let i = 0; i < count; ++i) {
      const item = this.tags.nth(i);
      const tag = await item.locator("span").textContent();
      if (tag) tags.push(tag);
    }
    return tags;
  }

  async getTitle() {
    return this.title.inputValue();
  }

  async getContent(format: "html" | "text") {
    return format === "html"
      ? await this.content.innerHTML()
      : (await this.content.innerText()).trim().replace(/\n+/gm, "\n");
  }

  async enterFocusMode() {
    await this.focusModeButton.click();
    await this.normalModeButton.waitFor();
  }

  async exitFocusMode() {
    await this.normalModeButton.click();
    await this.focusModeButton.waitFor();
  }

  async isFocusMode() {
    return await this.normalModeButton.isVisible();
  }

  async enterFullscreen() {
    await this.enterFullscreenButton.click();
    await this.exitFullscreenButton.waitFor();
  }

  async exitFullscreen() {
    await this.exitFullscreenButton.click();
    await this.enterFullscreenButton.waitFor();
  }

  async isFullscreen() {
    return await this.exitFullscreenButton.isVisible();
  }

  async getWordCount() {
    return parseInt(
      (await this.wordCountText.allInnerTexts())
        .toString()
        .replace(" words", "")
    );
  }

  async findTab(id: string) {
    for await (const item of iterateList(this.tabsList.locator(".tab"))) {
      const tabModel = new TabItemModel(item, this.page);
      if ((await tabModel.getId()) === id) return tabModel;
    }
  }
}
