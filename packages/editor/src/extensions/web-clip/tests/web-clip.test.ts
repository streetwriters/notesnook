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

import { createElement } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, expect, test, vi } from "vitest";
import { WebClipComponent } from "../component.js";
import { ReactNodeViewProps } from "../../react/index.js";
import { WebClipAttributes } from "../web-clip.js";

vi.mock("@notesnook/ui", () => ({ Icon: () => null }));
vi.mock("../../../toolbar/index.js", () => ({ Icons: {} }));
vi.mock("../../../toolbar/components/toolbar-group.js", () => ({
  ToolbarGroup: () => null
}));
vi.mock("../../../components/responsive/index.js", () => ({
  DesktopOnly: () => null
}));

afterEach(() => {
  vi.restoreAllMocks();
});

test("web clip is loaded into the iframe as utf-8 html", async () => {
  const createObjectURL = vi
    .spyOn(URL, "createObjectURL")
    .mockReturnValue("blob:web-clip");
  const html = `<html><head><title>Umlauts</title></head><body><p>äöü é á</p></body></html>`;
  const props = {
    editor: { storage: { getAttachmentData: async () => html } },
    node: {
      attrs: {
        type: "web-clip",
        hash: "hash",
        mime: "application/vnd.notesnook.web-clip",
        src: "https://example.com",
        title: "Umlauts",
        progress: 0,
        fullscreen: false
      }
    },
    selected: false,
    updateAttributes: () => {}
  } as unknown as ReactNodeViewProps<WebClipAttributes>;

  const root = createRoot(document.createElement("div"));
  flushSync(() => root.render(createElement(WebClipComponent, props)));
  await vi.waitFor(() => expect(createObjectURL).toHaveBeenCalledOnce());
  root.unmount();

  const blob = createObjectURL.mock.calls[0][0] as Blob;
  expect(blob.type).toBe("text/html; charset=utf-8");
  expect(await blob.text()).toContain("äöü é á");
});
