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

import { describe, expect, it, vi } from "vitest";

vi.mock("@notesnook/ui-kit", () => ({ Icon: () => null }));

const { mdiIcon, svgIcon } = await import("./icon-factory");

describe("icon factory", () => {
  it("gives an mdi icon its path as .path, like apps/web's icons", () => {
    expect(mdiIcon("M0 0h24v24H0z").path).toBe("M0 0h24v24H0z");
  });

  it("gives an svg icon its document as .path, which Icon's path draws", () => {
    const svg = "<svg viewBox='0 0 24 24'></svg>";
    expect(svgIcon(svg).path).toBe(svg);
  });

  it("still renders the kit Icon with the drawing and the props", () => {
    const element = (svgIcon("<svg/>") as (props: object) => any)({
      size: 13
    });
    expect(element.props).toMatchObject({ svg: "<svg/>", size: 13 });
  });
});
