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

import { environment, keyboard, type KeyEvent } from "@platform";
import { useEditorStore } from "../stores/editor-store";
import { useStore as useSearchStore } from "../stores/search-store";
import { useEditorManager } from "../components/editor/manager";
import { CommandPaletteDialog } from "../dialogs/command-palette";
import { hashNavigate } from "../navigation";
import { getKeybinding, keybindings } from "@notesnook/common";
import { KeyboardShortcutsDialog } from "../dialogs/keyboard-shortcuts-dialog";
import { isMac } from "../utils/platform";

function isInEditor(e: KeyEvent) {
  return e.inEditor;
}

const actions: Partial<
  Record<keyof typeof keybindings, (() => void) | ((e: KeyEvent) => void)>
> = {
  nextTab: () => useEditorStore.getState().focusNextTab(),
  previousTab: () => useEditorStore.getState().focusPreviousTab(),
  newTab: () => useEditorStore.getState().addTab(),
  newNote: () => useEditorStore.getState().newSession(),
  closeActiveTab: () => {
    const activeTab = useEditorStore.getState().getActiveTab();
    if (activeTab?.pinned) {
      useEditorStore.getState().focusLastActiveTab();
      return;
    }
    useEditorStore.getState().closeActiveTab();
  },
  closeAllTabs: () => useEditorStore.getState().closeAllTabs(),
  searchInNotes: (e: KeyEvent) => {
    if (isInEditor(e)) {
      const activeSession = useEditorStore.getState().getActiveSession();
      if (activeSession?.type === "readonly") {
        e.preventDefault();
        const editor = useEditorManager.getState().getEditor(activeSession.id);
        editor?.editor?.startSearch();
      }
      return;
    }
    e.preventDefault();

    useSearchStore.setState({ isSearching: true, searchType: "notes" });
  },
  openCommandPalette: () => {
    CommandPaletteDialog.close();
    CommandPaletteDialog.show({
      isCommandMode: true
    }).catch(() => {});
  },
  openQuickOpen: () => {
    CommandPaletteDialog.close();
    CommandPaletteDialog.show({
      isCommandMode: false
    }).catch(() => {});
  },
  openSettings: (e) => {
    if (isInEditor(e)) return;
    hashNavigate("/settings", { replace: true });
  },
  openKeyboardShortcuts: () => KeyboardShortcutsDialog.show({})
};

export function registerKeyMap() {
  Object.entries(actions).forEach(([id, action]) => {
    const keys = getKeybinding(
      id as keyof typeof keybindings,
      environment.isDesktopApp,
      isMac()
    );
    if (!keys || keys.length === 0) return;

    keyboard.register(keys, (e) => {
      e.preventDefault();
      action(e);
    });
  });
}
