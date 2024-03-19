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

import { PluginKey } from "prosemirror-state";

export interface Listeners<T> {
  [name: string]: Set<Listener<T>>;
}
export type Listener<T = never> = (data: T) => void;
export type Dispatch<T = never> = (
  eventName: PluginKey | string,
  data: T
) => void;

export class EventDispatcher<T = never> {
  private listeners: Listeners<T> = {};

  on(event: string, cb: Listener<T>): void {
    if (!this.listeners[event]) {
      this.listeners[event] = new Set();
    }

    this.listeners[event].add(cb);
  }

  off(event: string, cb: Listener<T>): void {
    if (!this.listeners[event]) {
      return;
    }

    if (this.listeners[event].has(cb)) {
      this.listeners[event].delete(cb);
    }
  }

  emit(event: string, data: T): void {
    if (!this.listeners[event]) {
      return;
    }

    this.listeners[event].forEach((cb) => cb(data));
  }

  destroy(): void {
    this.listeners = {};
  }
}
