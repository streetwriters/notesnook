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

import { readdirSync, readFileSync } from "fs";
import path from "path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Every theme-ui component is replaced by a marker element, so the test sees
// which theme-ui component a kit primitive renders and with which props.
vi.mock("@theme-ui/components", async () => {
  const { createElement, forwardRef } = await import("react");
  const names = [
    "Box",
    "Flex",
    "Grid",
    "Text",
    "Button",
    "Label",
    "Link",
    "Image",
    "Input",
    "Textarea",
    "Checkbox",
    "Radio",
    "Select",
    "Switch",
    "Slider",
    "Progress",
    "Donut"
  ];
  return Object.fromEntries(
    names.map((name) => [
      name,
      forwardRef((props: Record<string, unknown>, _ref) =>
        createElement("i", {
          "data-theme-ui": name,
          "data-test-id": props["data-test-id"],
          "data-sx": props.sx ? JSON.stringify(props.sx) : undefined
        })
      )
    ])
  );
});

const WEB = __dirname;
const read = (file: string) => readFileSync(path.join(WEB, file), "utf8");

describe("the web kit is a thin layer", () => {
  it("renders theme-ui's own component for every primitive", async () => {
    const kit: Record<string, any> = await import("./primitives");
    for (const name of [
      "Box",
      "Flex",
      "Grid",
      "Text",
      "Button",
      "Label",
      "Link",
      "Image",
      "Input",
      "Textarea",
      "Checkbox",
      "Radio",
      "Select",
      "Switch",
      "Slider",
      "Progress",
      "Donut"
    ]) {
      const html = renderToStaticMarkup(
        createElement(kit[name], { "data-test-id": "probe", columns: 2 })
      );
      expect(html, name).toBe(
        name === "Button"
          ? `<i data-theme-ui="Button" data-test-id="probe" data-sx="{&quot;display&quot;:&quot;flex&quot;}"></i>`
          : `<i data-theme-ui="${name}" data-test-id="probe"></i>`
      );
    }
  });

  it("hands sx to theme-ui instead of compiling it", async () => {
    const { Box } = await import("./primitives");
    const html = renderToStaticMarkup(
      createElement(Box, { sx: { bg: "background", p: 2 } })
    );
    expect(html).toContain(
      'data-sx="{&quot;bg&quot;:&quot;background&quot;,&quot;p&quot;:2}"'
    );
  });

  it("re-exports react-virtuoso's lists", async () => {
    const virtuoso = await import("react-virtuoso");
    const lists = await import("./lists");
    expect(lists.Virtuoso).toBe(virtuoso.Virtuoso);
    expect(lists.GroupedVirtuoso).toBe(virtuoso.GroupedVirtuoso);
    expect(lists.TableVirtuoso).toBe(virtuoso.TableVirtuoso);
  });

  it("re-exports react-modal as Modal and the lists from the index", () => {
    const index = read("index.ts");
    expect(index).toMatch(/export \{ default as Modal \} from "react-modal";/);
    expect(index).toMatch(
      /export \{[^}]*\bVirtuoso\b[^}]*\} from "\.\/lists";/
    );
    for (const name of [
      "TitleBar",
      "SplitPane",
      "Icon",
      "QRCode",
      "ColorPicker",
      "MenuPresenter",
      "PopupPresenter",
      "PopoverHost"
    ])
      expect(
        index.includes(name) || read("primitives.tsx").includes(`export const ${name} `),
        name
      ).toBe(true);
  });

  it("has no prop translation layer or CSS engine left", () => {
    const files = readdirSync(WEB, { recursive: true }) as string[];
    expect(files).not.toContain("use-dom.tsx");
    expect(files.some((file) => file.includes("engine"))).toBe(false);
    for (const file of files.filter(
      (file) => /\.tsx?$/.test(file) && !file.endsWith(".test.ts")
    )) {
      const source = read(file);
      expect(source, file).not.toMatch(/use-dom|style\/engine/);
      expect(source, file).not.toMatch(/resolveClassName|useDom\(/);
      // the deprecated React Native names are understood nowhere
      expect(source, file).not.toMatch(/\b(onPress|onChangeText|onHoverIn)\b/);
    }
  });
});
