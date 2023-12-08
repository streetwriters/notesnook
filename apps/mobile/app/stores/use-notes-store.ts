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

import { Note, VirtualizedGrouping } from "@notesnook/core";
import create, { State } from "zustand";
import { db } from "../common/database";

export interface NoteStore extends State {
  notes: VirtualizedGrouping<Note> | undefined;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setNotes: () => void;
  clearNotes: () => void;
}

export const useNoteStore = create<NoteStore>((set) => ({
  notes: undefined,
  loading: true,
  setLoading: (loading) => set({ loading: loading }),
  setNotes: async () => {
    const notes = await db.notes.all.grouped(
      db.settings.getGroupOptions("home")
    );
    await notes.item(0);
    set({
      notes: notes
    });
  },
  clearNotes: () => set({ notes: undefined })
}));
