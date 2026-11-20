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
import { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import React from "react";
import { Modal, Platform } from "react-native";
import { create } from "zustand";
import { ToastManager } from "../../services/event-manager";
import { NotesSourcePicker } from "../notes-widget-configure";
import { useUserStore } from "../../stores/use-user-store";
import { NotePreviewWidget } from "../../services/note-preview-widget";
import {
  NotesWidget,
  NotesWidgetSource
} from "../../services/widgets/notes-widget";
import { NotePicker } from "../note-preview-configure";

export const WIDGET_NOTE_PICKER_URL = "nn://pick_widget_note";
export const WIDGET_SOURCE_PICKER_URL = "nn://pick_widget_source";

type PickerKind = "note" | "source";

type WidgetPickerState = {
  kind?: PickerKind;
  slot?: string;
  root: boolean;
  open: (kind: PickerKind, slot?: string) => void;
  openFromLaunch: (url?: string | null) => void;
  close: () => void;
};

export const useWidgetPicker = create<WidgetPickerState>((set) => ({
  kind: undefined,
  root: false,
  open: (kind, slot) => set({ kind, slot }),
  openFromLaunch: (url) => {
    const kind = getWidgetPickerKind(url);
    if (kind && Platform.OS === "ios") {
      set({ kind, slot: getWidgetPickerSlot(url), root: true });
    }
  },
  close: () => set({ kind: undefined, slot: undefined, root: false })
}));

export function getWidgetPickerKind(
  url?: string | null
): PickerKind | undefined {
  if (url?.startsWith(WIDGET_NOTE_PICKER_URL)) return "note";
  if (url?.startsWith(WIDGET_SOURCE_PICKER_URL)) return "source";
}

export function getWidgetPickerSlot(url?: string | null) {
  const match = url ? /[?&]slot=([^&]*)/.exec(url) : null;
  return match ? decodeURIComponent(match[1]) : undefined;
}

export const useWidgetPickerAsRoot = () =>
  useWidgetPicker((state) => !!state.kind && state.root);

export const WidgetPickerContent = () => {
  const kind = useWidgetPicker((state) => state.kind);
  const slot = useWidgetPicker((state) => state.slot);
  const close = useWidgetPicker((state) => state.close);

  if (kind === "source") {
    return (
      <NotesSourcePicker
        description={strings.widgetSourcePickerDescription()}
        onSelect={(source: NotesWidgetSource) => {
          NotesWidget.chooseSource(source, slot);
          close();
          ToastManager.show({
            type: "success",
            message: strings.widgetSourceChosen(source.title)
          });
        }}
        onCancel={close}
      />
    );
  }
  return (
    <NotePicker
      onSelect={(note: Note) => {
        NotePreviewWidget.addNote(note);
        close();
      }}
      onCancel={close}
    />
  );
};

export const WidgetPicker = () => {
  const kind = useWidgetPicker((state) => state.kind);
  const root = useWidgetPicker((state) => state.root);
  const close = useWidgetPicker((state) => state.close);
  const appLocked = useUserStore((state) => state.appLocked);

  if (Platform.OS !== "ios" || !kind || root || appLocked) return null;

  return (
    <Modal
      visible
      animationType="none"
      presentationStyle="fullScreen"
      onRequestClose={close}
    >
      <WidgetPickerContent />
    </Modal>
  );
};
