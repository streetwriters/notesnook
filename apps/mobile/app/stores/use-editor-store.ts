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

import create, { State } from "zustand";

export interface EditorStore extends State {
  currentEditingNote: string | null;
  setCurrentlyEditingNote: (note: string | null) => void;
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
  searchSelection: string | null;
  readonly: boolean;
  setReadonly: (readonly: boolean) => void;
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  currentEditingNote: null,
  setCurrentlyEditingNote: (note) => set({ currentEditingNote: note }),
  sessionId: null,
  setSessionId: (sessionId) => {
    set({ sessionId });
  },
  searchSelection: null,
  readonly: false,
  setReadonly: (readonly) => {
    set({ readonly: readonly });
  }
}));
