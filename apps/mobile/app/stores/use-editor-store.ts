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
import { eSubscribeEvent, eUnSubscribeEvent } from "../services/event-manager";

export interface EditorStore extends State {
  currentEditingNote: string | null;
  setCurrentlyEditingNote: (note: string | null) => void;
  sessionId: string | null;
  setSessionId: (sessionId: string | null) => void;
  searchReplace: boolean;
  setSearchReplace: (searchReplace: boolean) => void;
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
  searchReplace: false,
  searchSelection: null,
  readonly: false,
  setReadonly: (readonly) => {
    set({ readonly: readonly });
  },
  setSearchReplace: (searchReplace) => {
    if (!searchReplace) {
      set({ searchSelection: null, searchReplace: false });
      return;
    }
    const func = (value: string) => {
      eUnSubscribeEvent("selectionvalue", func);

      if (!value && get().searchReplace) {
        //  endSearch();
        return;
      }
      set({ searchSelection: value, searchReplace: true });
    };
    eSubscribeEvent("selectionvalue", func);
    // tiny.call(
    //   EditorWebView,
    //   `(function() {
    //   if (editor) {
    //     reactNativeEventHandler('selectionvalue',editor.selection.getContent());
    //   }
    // })();`
    // );
  }
}));
