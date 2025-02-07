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

import {
  ArrowTopRight,
  Duplicate,
  InternalLink,
  Notebook,
  NotebookEdit,
  Pin,
  Plus,
  Radar,
  Readonly,
  Reminder,
  Rename,
  Star,
  Tag
} from "../../components/icons";
import { hashNavigate, navigate } from "../../navigation";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { AttachmentsDialog } from "../attachments-dialog";
import { CreateColorDialog } from "../create-color-dialog";
import { store as noteStore } from "../../stores/note-store";
import { store as notebookStore } from "../../stores/notebook-store";
import { AddReminderDialog } from "../add-reminder-dialog";
import { MoveNoteDialog } from "../move-note-dialog";
import { AddTagsDialog } from "../add-tags-dialog";
import { createInternalLink } from "@notesnook/core";
import { writeToClipboard } from "../../utils/clipboard";
import { EditTagDialog } from "../item-dialog";

function getLabelForActiveNoteGroup() {
  const text = "Actions for ";
  const currentNote = useEditorStore.getState().getActiveNote();
  return currentNote ? `${text} note: ${currentNote.title}` : undefined;
}

function getLabelForActiveNotebookGroup() {
  const text = "Actions for ";
  const context = noteStore.get().context;
  return context?.type === "notebook" && context.item?.title
    ? `${text} notebook: ${context.item.title}`
    : undefined;
}

function getLabelForActiveTagGroup() {
  const text = "Actions for ";
  const context = noteStore.get().context;
  return context?.type === "tag" && context.item?.title
    ? `${text} tag: ${context.item.title}`
    : undefined;
}

export const commands = [
  {
    id: "duplicate-active-note",
    title: () => "Duplicate",
    icon: Duplicate,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        noteStore.get().duplicate(currentNote.id);
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "pin-active-note",
    title: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      return currentNote ? (currentNote.pinned ? "Unpin" : "Pin") : undefined;
    },
    icon: Pin,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        noteStore.get().pin(!currentNote.pinned, currentNote.id);
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "readonly-active-note",
    title: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      return currentNote ? "Toggle readonly" : undefined;
    },
    icon: Readonly,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        noteStore.get().readonly(!currentNote.readonly, currentNote.id);
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "favorite-active-note",
    title: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      return currentNote
        ? currentNote.favorite
          ? "Unfavorite"
          : "Favorite"
        : undefined;
    },
    icon: Star,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        noteStore.get().favorite(!currentNote.favorite, currentNote.id);
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "remind-me-active-note",
    title: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        return "Remind me";
      }
      return "n/a";
    },
    icon: Reminder,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (!currentNote) return;
      if (currentNote.type === "trash") return;
      AddReminderDialog.show({ note: currentNote });
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "link-notebooks-active-note",
    title: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      return currentNote ? "Link notebooks" : undefined;
    },
    icon: Notebook,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        MoveNoteDialog.show({ noteIds: [currentNote.id] });
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "add-tags-active-note",
    title: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      return currentNote ? "Add tags" : undefined;
    },
    icon: Tag,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        AddTagsDialog.show({ noteIds: [currentNote.id] });
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "copy-link-active-note",
    title: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      return currentNote ? "Copy link" : undefined;
    },
    icon: InternalLink,
    action: () => {
      const currentNote = useEditorStore.getState().getActiveNote();
      if (currentNote) {
        const link = createInternalLink("note", currentNote.id);
        writeToClipboard({
          "text/plain": link,
          "text/html": `<a href="${link}">${currentNote.title}</a>`,
          "text/markdown": `[${currentNote.title}](${link})`
        });
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => !useEditorStore.getState().getActiveNote(),
    dynamic: true
  },
  {
    id: "edit-active-notebook",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "notebook" ? "Edit" : undefined;
    },
    icon: NotebookEdit,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type === "notebook") {
        hashNavigate(`/notebooks/${context.id}/edit`);
      }
    },
    group: getLabelForActiveNotebookGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return context?.type !== "notebook";
    },
    dynamic: true
  },
  {
    id: "pin-active-notebook",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "notebook"
        ? context.item?.pinned
          ? "Unpin"
          : "Pin"
        : undefined;
    },
    icon: Pin,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type === "notebook") {
        notebookStore.pin(!context.item?.pinned, context.id);
      }
    },
    group: getLabelForActiveNotebookGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return context?.type !== "notebook";
    },
    dynamic: true
  },
  {
    id: "rename-active-tag",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "tag" ? "Rename" : undefined;
    },
    icon: Rename,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type === "tag" && context.item) {
        EditTagDialog.show(context.item);
      }
    },
    group: getLabelForActiveTagGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return context?.type !== "tag";
    },
    dynamic: true
  },
  {
    id: "next-tab",
    title: "Next tab",
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().focusNextTab(),
    group: "Navigate"
  },
  {
    id: "previous-tab",
    title: "Previous tab",
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().focusPreviousTab(),
    group: "Navigate"
  },
  {
    id: "notes",
    title: "Notes",
    icon: ArrowTopRight,
    action: () => navigate("/"),
    group: "Navigate"
  },
  {
    id: "notebooks",
    title: "Notebooks",
    icon: ArrowTopRight,
    action: () => navigate("/notebooks"),
    group: "Navigate"
  },
  {
    id: "tags",
    title: "Tags",
    icon: ArrowTopRight,
    action: () => navigate("/tags"),
    group: "Navigate"
  },
  {
    id: "favorites",
    title: "Favorites",
    icon: ArrowTopRight,
    action: () => navigate("/favorites"),
    group: "Navigate"
  },
  {
    id: "reminders",
    title: "Reminders",
    icon: ArrowTopRight,
    action: () => navigate("/reminders"),
    group: "Navigate"
  },
  {
    id: "monographs",
    title: "Monographs",
    icon: ArrowTopRight,
    action: () => navigate("/monographs"),
    group: "Navigate"
  },
  {
    id: "trash",
    title: "Trash",
    icon: ArrowTopRight,
    action: () => navigate("/trash"),
    group: "Navigate"
  },
  {
    id: "settings",
    title: "Settings",
    icon: ArrowTopRight,
    action: () => hashNavigate("/settings", { replace: true }),
    group: "Navigate"
  },
  {
    id: "help",
    title: "Help",
    icon: ArrowTopRight,
    action: () => (window.location.href = "https://help.notesnook.com"),
    group: "Navigate"
  },
  {
    id: "attachment-manager",
    title: "Attachment manager",
    icon: ArrowTopRight,
    action: () => AttachmentsDialog.show({}),
    group: "Navigate"
  },
  {
    id: "new-note",
    title: "New note",
    icon: Plus,
    action: () => useEditorStore.getState().newSession(),
    group: "Create"
  },
  {
    id: "new-notebook",
    title: "New notebook",
    icon: Plus,
    action: () => hashNavigate("/notebooks/create", { replace: true }),
    group: "Create"
  },
  {
    id: "new-tag",
    title: "New tag",
    icon: Plus,
    action: () => hashNavigate("/tags/create", { replace: true }),
    group: "Create"
  },
  {
    id: "new-reminder",
    title: "New reminder",
    icon: Plus,
    action: () => hashNavigate(`/reminders/create`, { replace: true }),
    group: "Create"
  },
  {
    id: "new-color",
    title: "New color",
    icon: Plus,
    action: () => CreateColorDialog.show(true),
    group: "Create"
  },
  {
    id: "close-tab",
    title: "Close current tab",
    icon: Radar,
    action: () =>
      useEditorStore
        .getState()
        .closeTabs(useEditorStore.getState().activeTabId ?? ""),
    group: "General"
  },
  {
    id: "toggle-theme",
    title: "Toggle theme",
    icon: Radar,
    action: () => useThemeStore.getState().toggleColorScheme(),
    group: "General"
  }
];
