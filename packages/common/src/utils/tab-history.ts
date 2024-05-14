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

import { EditorSessionItem } from "./editor-sessions";

export type TabState = {
  tabHistory: Record<number, { back_stack: string[]; forward_stack: string[] }>;
  canGoBack?: boolean;
  canGoForward?: boolean;
  sessionId?: string;
};

export class TabHistory {
  constructor(
    public options: {
      set: (state: TabState) => void;
      get: () => TabState;
      getCurrentTab: () => number;
      loadSession: (sessionId: string) => Promise<boolean>;
      newSession: (sessionId: string, tabId: number, noteId: string) => void;
      clearSessionsForTabId: (tabid: number) => void;
      getSession: (sessionId: string) => Promise<EditorSessionItem | undefined>;
      commit: () => void;
    }
  ) {}

  get back_stack() {
    return (
      this.options
        .get()
        .tabHistory[this.options.getCurrentTab()]?.back_stack.slice() || []
    );
  }

  set back_stack(value: string[]) {
    const currentTab = this.options.getCurrentTab();
    const tabHistory = this.options.get().tabHistory;
    this.options.set({
      canGoBack: value.length > 1,
      tabHistory: {
        ...tabHistory,
        [currentTab]: {
          ...(tabHistory[currentTab] || {}),
          back_stack: value
        }
      }
    });
    this.options.commit();
  }

  get forward_stack() {
    return (
      this.options
        .get()
        .tabHistory[this.options.getCurrentTab()]?.forward_stack.slice() || []
    );
  }

  set forward_stack(value: string[]) {
    const currentTab = this.options.getCurrentTab();
    const tabHistory = this.options.get().tabHistory;
    this.options.set({
      canGoForward: value.length > 1,
      tabHistory: {
        ...tabHistory,
        [currentTab]: {
          ...(tabHistory[currentTab] || {}),
          forward_stack: value
        }
      }
    });
    this.options.commit();
  }

  async add(noteId: string) {
    const currentItemId = this.back_stack[this.back_stack.length - 1];
    const currentSession = currentItemId
      ? await this.options.getSession(currentItemId)
      : undefined;

    if (currentSession && currentSession.noteId === noteId) return;
    const newSessionId = Math.random()
      .toString(36)
      .replace("0.", "es-" || "");

    const back_stack = this.back_stack;
    back_stack.push(newSessionId);
    this.options.newSession(newSessionId, this.options.getCurrentTab(), noteId);

    this.back_stack = back_stack;
    this.forward_stack = [];
  }

  clearStackForTab(tabId: number) {
    this.options.set({
      tabHistory: {
        ...this.options.get().tabHistory,
        [tabId]: {
          back_stack: [],
          forward_stack: []
        }
      }
    });
    this.options.clearSessionsForTabId(tabId);
  }

  async back(): Promise<string | null> {
    if (!this.canGoBack()) return null;

    const back_stack = this.back_stack;
    const forward_stack = this.forward_stack;

    const current_item = back_stack.pop();
    const next_item = back_stack[back_stack.length - 1];
    if (next_item) {
      current_item && forward_stack.push(current_item);

      this.forward_stack = forward_stack;
      this.back_stack = back_stack;

      if (await this.options.loadSession(next_item)) {
        return next_item;
      } else if (this.back_stack.length > 1) {
        return this.back();
      }
    }
    return null;
  }

  async forward(): Promise<string | null> {
    if (!this.canGoForward()) return null;

    const back_stack = this.back_stack;
    const forward_stack = this.forward_stack;

    const item = forward_stack.pop();
    if (item) {
      this.forward_stack = forward_stack;
      if (await this.options.loadSession(item)) {
        back_stack.push(item);
        this.back_stack = back_stack;
        return item;
      } else if (this.forward_stack.length > 0) {
        return this.forward();
      }
    }
    return null;
  }

  getHistory() {
    return {
      back: this.back_stack,
      forward: this.forward_stack
    };
  }

  getCurrentSession() {
    return this.back_stack[this.back_stack.length - 1];
  }

  canGoBack() {
    return this.back_stack.length > 1;
  }

  canGoForward() {
    return this.forward_stack.length > 0;
  }
}
