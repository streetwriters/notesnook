import { Note } from "@notesnook/core";
import React from "react";
import { Linking, Modal, Platform } from "react-native";
import { create } from "zustand";
import { useUserStore } from "../../stores/use-user-store";
import { NotePreviewWidget } from "../../services/note-preview-widget";
import { NotePicker } from ".";

export const WIDGET_NOTE_PICKER_URL = "nn://pick_widget_note";

type PickerKind = "note";

type WidgetPickerState = {
  kind?: PickerKind;
  root: boolean;
  open: (kind: PickerKind) => void;
  close: () => void;
};

export const useWidgetPicker = create<WidgetPickerState>((set) => ({
  kind: undefined,
  root: false,
  open: (kind) => set({ kind }),
  close: () => set({ kind: undefined, root: false })
}));

export function getWidgetPickerKind(
  url?: string | null
): PickerKind | undefined {
  if (url?.startsWith(WIDGET_NOTE_PICKER_URL)) return "note";
}

export const widgetPickerLaunchCheck: Promise<void> =
  Platform.OS === "ios"
    ? Linking.getInitialURL()
        .then((url) => {
          const kind = getWidgetPickerKind(url);
          if (kind) {
            useWidgetPicker.setState({
              kind,
              root: true
            });
          }
        })
        .catch(() => {})
    : Promise.resolve();

export const useWidgetPickerAsRoot = () =>
  useWidgetPicker((state) => !!state.kind && state.root);

const PickerContent = () => {
  const close = useWidgetPicker((state) => state.close);

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

export const WidgetPickerRoot = PickerContent;

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
      <PickerContent />
    </Modal>
  );
};
