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

import { test, expect, vi } from "vitest";
import { EventManager } from "../event-manager.js";

test("one handler can subscribe to multiple events", () => {
  const manager = new EventManager();
  const handler = vi.fn();
  manager.subscribe("a", handler);
  manager.subscribe("b", handler);

  manager.publish("a");
  manager.publish("b");

  expect(handler).toHaveBeenCalledTimes(2);
});

test("unsubscribing from one event keeps the other subscription", () => {
  const manager = new EventManager();
  const handler = vi.fn();
  const a = manager.subscribe("a", handler);
  manager.subscribe("b", handler);

  a.unsubscribe();
  manager.publish("a");
  manager.publish("b");

  expect(handler).toHaveBeenCalledTimes(1);
});

test("a throwing handler does not stop other handlers", () => {
  const manager = new EventManager();
  const handler = vi.fn();
  const error = vi.spyOn(console, "error").mockImplementation(() => {});
  manager.subscribe("a", () => {
    throw new Error("fail");
  });
  manager.subscribe("a", handler);

  expect(() => manager.publish("a")).not.toThrow();
  expect(handler).toHaveBeenCalledOnce();
  error.mockRestore();
});

test("once handlers are only called once", () => {
  const manager = new EventManager();
  const handler = vi.fn();
  manager.subscribe("a", handler, true);

  manager.publish("a");
  manager.publish("a");

  expect(handler).toHaveBeenCalledOnce();
});
