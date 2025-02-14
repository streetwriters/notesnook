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

import { expect as jestExpect } from "@jest/globals";
import { device as _device, expect } from "detox";
import { readFileSync } from "fs";
import { toMatchImageSnapshot } from "jest-image-snapshot";
import type { RouteName } from "../../app/stores/use-navigation-store";
import { notesnook } from "../test.ids";
jestExpect.extend({ toMatchImageSnapshot });

const testvars = {
  isFirstTest: true
};

class Element {
  element: Detox.NativeElement;
  constructor(public type: "id" | "text", public value: string) {
    if (type == "id") {
      this.element = element(by.id(value)).atIndex(0);
    } else {
      this.element = element(by.text(value)).atIndex(0);
    }
  }

  isVisible(timeout?: number) {
    return waitFor(this.element)
      .toBeVisible()
      .withTimeout(timeout || 500);
  }

  isNotVisible(timeout?: number) {
    return waitFor(this.element)
      .not.toBeVisible()
      .withTimeout(timeout || 500);
  }

  async waitAndTap(timeout?: number) {
    await waitFor(this.element)
      .toBeVisible()
      .withTimeout(timeout || 500);
    await this.element.tap();
  }

  tap(point?: Detox.Point2D): Promise<void> {
    return this.element.tap(point);
  }

  static fromId(id: string) {
    return new Element("id", id);
  }
  static fromText(text: string) {
    return new Element("text", text);
  }
}

const Tests = {
  awaitLaunch: async () => {
    await waitFor(element(by.id(notesnook.ids.default.root)))
      .toBeVisible()
      .withTimeout(500);
  },
  sleep: (duration: number) => {
    return new Promise((resolve) =>
      setTimeout(() => {
        resolve(undefined);
      }, duration)
    );
  },
  fromId: Element.fromId,
  fromText: Element.fromText,
  async exitEditor() {
    await _device.pressBack();
    await _device.pressBack();
  },
  async createNote(_title?: string, _body?: string) {
    let title = _title || "Test note description that ";
    let body =
      _body ||
      "Test note description that is very long and should not fit in text.";
    await Tests.fromId(notesnook.buttons.add).tap();
    await expect(web().element(by.web.className("ProseMirror"))).toExist();
    // await web().element(by.web.className("ProseMirror")).tap();
    await web().element(by.web.className("ProseMirror")).typeText(body, true);
    await Tests.exitEditor();
    await Tests.fromText(body).isVisible();
    return { title, body };
  },
  async navigate(screen: RouteName | ({} & string)) {
    let menu = Tests.fromId(notesnook.ids.default.header.buttons.left);
    await menu.waitAndTap();
    await Tests.fromText(screen as string).waitAndTap();
  },
  async openSideMenu() {
    await Tests.fromId(notesnook.ids.default.header.buttons.left).waitAndTap();
  },
  async prepare() {
    await device.disableSynchronization();
    if (testvars.isFirstTest) {
      testvars.isFirstTest = false;
      return await Tests.awaitLaunch();
    }
    await device.reverseTcpPort(8081);
    await device.uninstallApp();
    await device.installApp();
    await device.launchApp({ newInstance: true });
    await Tests.awaitLaunch();
  },
  async createNotebook(title = "Notebook 1", description = true) {
    await Tests.sleep(1000);
    const titleInput = Tests.fromId(
      notesnook.ids.dialogs.notebook.inputs.title
    );
    await titleInput.isVisible();
    await titleInput.element.typeText(title);
    if (description) {
      await Tests.fromId(
        notesnook.ids.dialogs.notebook.inputs.description
      ).element.typeText(`Description of ${title}`);
    }
    await Tests.fromText("Add").waitAndTap();
  },
  async matchSnapshot(element: Element, name: string) {
    let path = await element.element.takeScreenshot(name);
    const bitmapBuffer = readFileSync(path);
    (jestExpect(bitmapBuffer) as any).toMatchImageSnapshot({
      failureThreshold: 200,
      failureThresholdType: "pixel"
    });
  }
};

export { Element, Tests };
