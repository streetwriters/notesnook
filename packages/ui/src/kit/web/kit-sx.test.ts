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

import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { withKitSx } from "./kit-sx";

type Props = Record<string, any>;

function passed(props: Props): Props {
  let received: Props = {};
  const Probe = (inner: Props) => {
    received = inner;
    return null;
  };
  const Component = withKitSx<ComponentType<Props>>(Probe);
  renderToStaticMarkup(createElement(Component, props));
  return received;
}

describe("withKitSx", () => {
  it("passes every prop through untouched", () => {
    const onClick = () => undefined;
    const received = passed({
      "data-test-id": "x",
      onClick,
      className: "a"
    });
    expect(received["data-test-id"]).toBe("x");
    expect(received.onClick).toBe(onClick);
    expect(received.className).toBe("a");
    expect("sx" in received).toBe(false);
  });

  it("does not rename the removed React Native names", () => {
    const onPress = () => undefined;
    const received = passed({ onPress, testID: "t", numberOfLines: 2 });
    expect(received.onPress).toBe(onPress);
    expect(received.testID).toBe("t");
    expect(received.onClick).toBeUndefined();
    expect(received["data-test-id"]).toBeUndefined();
    expect(received.sx).toBeUndefined();
  });

  it("rewrites kit-only sx shapes", () => {
    const received = passed({
      sx: { borderTop: "1px solid transparent" }
    });
    expect(received.sx).toEqual(expect.objectContaining({}));
    expect(received.sx.borderTop).not.toBe(undefined);
  });
});
