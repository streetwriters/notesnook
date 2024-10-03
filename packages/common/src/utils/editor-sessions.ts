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

export type EditorSessionItem = {
  tabId: number;
  noteId: string;
  scrollTop: number;
  from: number;
  to: number;
  id: string;
};

export class EditorSessions extends Map<string, EditorSessionItem> {
  timer: NodeJS.Timeout | null = null;
  constructor(
    public options: {
      getGlobalNoteState: () => Record<
        string,
        { top: number; from: number; to: number }
      >;
    }
  ) {
    super();
    const savedSessions = localStorage.getItem("editor-sessions");
    if (savedSessions) {
      const parsed = JSON.parse(savedSessions);
      for (const [key, value] of Object.entries(parsed)) {
        this.set(key, value as EditorSessionItem);
      }
    }
  }

  save() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(() => {
      localStorage.setItem(
        "editor-sessions",
        JSON.stringify(Object.fromEntries(this.entries()))
      );
    }, 1000);
  }

  get(id: string): EditorSessionItem | undefined {
    return super.get(id);
  }

  set(id: string, session: EditorSessionItem): this {
    super.set(id, session);
    this.save();
    return this;
  }

  delete(key: string): boolean {
    super.delete(key);
    this.save();
    return true;
  }

  newSession(
    sessionId: string,
    tabId: number,
    noteId: string
  ): EditorSessionItem {
    const session: EditorSessionItem = {
      tabId,
      noteId,
      scrollTop: 0 || this.options.getGlobalNoteState()?.[noteId]?.top,
      from: 0 || this.options.getGlobalNoteState()?.[noteId]?.from,
      to: 0 || this.options.getGlobalNoteState()?.[noteId]?.to,
      id: sessionId
    };
    this.set(sessionId, session);
    return session;
  }

  updateSession(id: string, session: Partial<EditorSessionItem>): this {
    const existing = this.get(id);
    if (existing) {
      this.set(id, { ...existing, ...session });
    }
    return this;
  }

  deleteForTabId(tabId: number) {
    for (const [key, value] of this.entries()) {
      if (value.tabId === tabId) {
        this.delete(key);
      }
    }
  }
}
