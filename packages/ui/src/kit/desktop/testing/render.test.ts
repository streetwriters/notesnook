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

import { createElement, useEffect, useState } from "react";
import { expect, test } from "vitest";
import { render, settle } from "./render";

function Counter(props: { onMount: () => void }) {
  const [count, setCount] = useState(0);
  useEffect(() => props.onMount(), []);
  return createElement(
    "View",
    { testID: "counter", onPress: () => setCount((value) => value + 1) },
    `count ${count}`
  );
}

test("renders, runs effects, re-renders on state and unmounts", async () => {
  let mounted = 0;
  const view = await render(
    createElement(Counter, { onMount: () => void mounted++ })
  );
  expect(mounted).toBe(1);
  expect(view.text()).toBe("count 0");

  await settle(() => view.byTestId("counter").props.onPress());
  expect(view.text()).toBe("count 1");

  await view.unmount();
  expect(view.queryByTestId("counter")).toBeUndefined();
});
