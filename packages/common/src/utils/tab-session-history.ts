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

import { getId } from "@notesnook/core";

export type TabState = {
  tabSessionHistory: Record<
    number,
    { back_stack: string[]; forward_stack: string[] }
  >;
  canGoBack?: boolean;
  canGoForward?: boolean;
  sessionId?: string;
};

export class TabSessionHistory {
  constructor(
    public options: {
      set: (state: TabState) => void;
      get: () => TabState;
      getCurrentTab: () => number;
    }
  ) {}

  get back_stack() {
    return (
      this.options
        .get()
        .tabSessionHistory[this.options.getCurrentTab()]?.back_stack.slice() ||
      []
    );
  }

  set back_stack(value: string[]) {
    const currentTab = this.options.getCurrentTab();
    const tabHistory = this.options.get().tabSessionHistory;
    console.log("back_stack", value);
    this.options.set({
      canGoBack: value.length > 1,
      sessionId: this.currentSessionId(),
      tabSessionHistory: {
        ...tabHistory,
        [currentTab]: {
          ...(tabHistory[currentTab] || {}),
          back_stack: value
        }
      }
    });
  }

  get forward_stack() {
    return (
      this.options
        .get()
        .tabSessionHistory[
          this.options.getCurrentTab()
        ]?.forward_stack.slice() || []
    );
  }

  set forward_stack(value: string[]) {
    const currentTab = this.options.getCurrentTab();
    const tabHistory = this.options.get().tabSessionHistory;
    console.log("forward_stack", value);
    this.options.set({
      canGoForward: value.length > 0,
      sessionId: this.currentSessionId(),
      tabSessionHistory: {
        ...tabHistory,
        [currentTab]: {
          ...(tabHistory[currentTab] || {}),
          forward_stack: value
        }
      }
    });
  }

  add() {
    const sessionId = getId();
    const back_stack = this.back_stack;
    back_stack.push(sessionId);
    this.back_stack = back_stack;
    this.forward_stack = [];
    return sessionId;
  }

  clearStackForTab(tabId: number) {
    this.options.set({
      tabSessionHistory: {
        ...this.options.get().tabSessionHistory,
        [tabId]: {
          back_stack: [],
          forward_stack: []
        }
      }
    });
  }

  back(): string | null {
    if (!this.canGoBack()) return null;

    const back_stack = this.back_stack;
    const forward_stack = this.forward_stack;

    const current_item = back_stack.pop();
    const next_item = back_stack[back_stack.length - 1];

    current_item && forward_stack.push(current_item);

    this.forward_stack = forward_stack;
    this.back_stack = back_stack;

    console.log("back", this.forward_stack, this.back_stack);

    return next_item;
  }

  remove(id: string) {
    const back_stack = this.back_stack;
    let index = back_stack.findIndex((item) => item === id);
    if (index === -1) {
      const forward_stack = this.forward_stack;
      index = forward_stack.findIndex((item) => item === id);
      forward_stack.splice(index, 1);
      this.forward_stack = forward_stack;
    } else {
      back_stack.splice(index, 1);
      this.back_stack = back_stack;
    }
  }

  forward(): string | null {
    if (!this.canGoForward()) return null;

    const back_stack = this.back_stack;
    const forward_stack = this.forward_stack;

    const item = forward_stack.pop() as string;
    this.forward_stack = forward_stack;
    back_stack.push(item);
    this.back_stack = back_stack;
    return item;
  }

  currentSessionId() {
    return this.back_stack[this.back_stack.length - 1];
  }

  getHistory() {
    return {
      back: this.back_stack,
      forward: this.forward_stack
    };
  }

  canGoBack() {
    return this.back_stack.length > 1;
  }

  canGoForward() {
    return this.forward_stack.length > 0;
  }
}
