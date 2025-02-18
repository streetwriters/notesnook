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

import { createInternalLink, hosts } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";
import { Multiselect } from "../../common/multi-select";
import { useEditorManager } from "../../components/editor/manager";
import {
  ArrowLeft,
  ArrowRight,
  ArrowTopRight,
  Copy,
  DeleteForver,
  Duplicate,
  Edit,
  Editor,
  InternalLink,
  Notebook,
  NotebookEdit,
  OpenInNew,
  Pin,
  Plus,
  Publish,
  Radar,
  Readonly,
  Reminder,
  Restore,
  Shortcut,
  Star,
  Sync,
  Tag,
  Trash
} from "../../components/icons";
import { showPublishView } from "../../components/publish-view";
import { deleteTrash } from "../../components/trash-item";
import { hashNavigate, navigate } from "../../navigation";
import { store as appStore } from "../../stores/app-store";
import { useEditorStore } from "../../stores/editor-store";
import { store as monographStore } from "../../stores/monograph-store";
import { store as noteStore } from "../../stores/note-store";
import { store as notebookStore } from "../../stores/notebook-store";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { store as trashStore } from "../../stores/trash-store";
import { writeToClipboard } from "../../utils/clipboard";
import { AddNotebookDialog } from "../add-notebook-dialog";
import { AddReminderDialog } from "../add-reminder-dialog";
import { AddTagsDialog } from "../add-tags-dialog";
import { AttachmentsDialog } from "../attachments-dialog";
import { ConfirmDialog } from "../confirm";
import { CreateColorDialog } from "../create-color-dialog";
import { EditTagDialog } from "../item-dialog";
import { MoveNoteDialog } from "../move-note-dialog";

function getLabelForActiveNoteGroup() {
  const note = useEditorStore.getState().getActiveNote();
  return note ? strings.actionsForNote(note.title) : undefined;
}

function getLabelForActiveNotebookGroup() {
  const context = noteStore.get().context;
  return context?.type === "notebook" && context.item?.title
    ? strings.actionsForNotebook(context.item.title)
    : undefined;
}

function getLabelForActiveTagGroup() {
  const context = noteStore.get().context;
  return context?.type === "tag" && context.item?.title
    ? strings.actionsForTag(context.item.title)
    : undefined;
}

export const commands = [
  {
    id: "pin-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? (note.pinned ? strings.unpin() : strings.pin()) : undefined;
    },
    icon: Pin,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      noteStore.get().pin(!note.pinned, note.id);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "readonly-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.toggleReadonly() : undefined;
    },
    icon: Readonly,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      noteStore.get().readonly(!note.readonly, note.id);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "favorite-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note
        ? note.favorite
          ? strings.unfavorite()
          : strings.favorite()
        : undefined;
    },
    icon: Star,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      noteStore.get().favorite(!note.favorite, note.id);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "remind-me-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.remindMe() : undefined;
    },
    icon: Reminder,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      if (note.type === "trash") return;
      AddReminderDialog.show({ note: note });
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "link-notebooks-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.linkNotebooks() : undefined;
    },
    icon: Notebook,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      MoveNoteDialog.show({ noteIds: [note.id] });
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "add-tags-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.addTags() : undefined;
    },
    icon: Tag,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      AddTagsDialog.show({ noteIds: [note.id] });
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "publish-on-monograph-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.publishOnMonograph() : undefined;
    },
    icon: Publish,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note || note.type === "trash") return;
      const isPublished = db.monographs.isPublished(note.id);
      if (isPublished) return;
      showPublishView(note);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return (
        !note || note.type === "trash" || db.monographs.isPublished(note.id)
      );
    },
    dynamic: true
  },
  {
    id: "open-in-monograph-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.openInMonograph() : undefined;
    },
    icon: OpenInNew,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note || note.type === "trash") return;
      const isPublished = db.monographs.isPublished(note.id);
      if (!isPublished) return;
      const url = `${hosts.MONOGRAPH_HOST}/${note.id}`;
      window.open(url, "_blank");
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return (
        !note || note.type === "trash" || !db.monographs.isPublished(note.id)
      );
    },
    dynamic: true
  },
  {
    id: "copy-monograph-link-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.copyMonographLink() : undefined;
    },
    icon: Copy,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note || note.type === "trash") return;
      const isPublished = db.monographs.isPublished(note.id);
      if (!isPublished) return;
      const url = `${hosts.MONOGRAPH_HOST}/${note.id}`;
      writeToClipboard({
        "text/plain": url,
        "text/html": `<a href="${url}">${note.title}</a>`,
        "text/markdown": `[${note.title}](${url})`
      });
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return (
        !note || note.type === "trash" || !db.monographs.isPublished(note.id)
      );
    },
    dynamic: true
  },
  {
    id: "toggle-sync-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note
        ? note?.localOnly
          ? strings.turnSyncOn()
          : strings.turnSyncOff()
        : undefined;
    },
    icon: Sync,
    action: async () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note || note.type === "trash") return;
      if (
        note.localOnly ||
        (await ConfirmDialog.show({
          title: strings.syncOffConfirm(1),
          message: strings.syncOffDesc(1),
          positiveButtonText: strings.yes(),
          negativeButtonText: strings.no()
        }))
      ) {
        await noteStore.localOnly(!note.localOnly, note.id);
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "unpublish-on-monograph-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.unpublishOnMonograph() : undefined;
    },
    icon: Publish,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note || note.type === "trash") return;
      monographStore.get().unpublish(note.id);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return (
        !note || note.type === "trash" || !db.monographs.isPublished(note.id)
      );
    },
    dynamic: true
  },
  {
    id: "copy-link-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.copyLink() : undefined;
    },
    icon: InternalLink,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (note) {
        const link = createInternalLink("note", note.id);
        writeToClipboard({
          "text/plain": link,
          "text/html": `<a href="${link}">${note.title}</a>`,
          "text/markdown": `[${note.title}](${link})`
        });
      }
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "duplicate-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.duplicate() : undefined;
    },
    icon: Duplicate,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      noteStore.get().duplicate(note.id);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type === "trash";
    },
    dynamic: true
  },
  {
    id: "move-to-trash-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.moveToTrash() : undefined;
    },
    icon: Trash,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note || db.monographs.isPublished(note.id)) return;
      Multiselect.moveNotesToTrash([note.id], false);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return (
        !note || note.type === "trash" || db.monographs.isPublished(note.id)
      );
    },
    dynamic: true
  },
  {
    id: "restore-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.restore() : undefined;
    },
    icon: Restore,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      trashStore.restore(note.id);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type !== "trash";
    },
    dynamic: true
  },
  {
    id: "delete-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? strings.delete() : undefined;
    },
    icon: DeleteForver,
    action: () => {
      const note = useEditorStore.getState().getActiveNote();
      if (!note) return;
      deleteTrash([note.id]);
    },
    group: getLabelForActiveNoteGroup,
    hidden: () => {
      const note = useEditorStore.getState().getActiveNote();
      return !note || note.type !== "trash";
    },
    dynamic: true
  },
  {
    id: "add-subnotebook-active-notebook",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "notebook"
        ? strings.addSubnotebook()
        : undefined;
    },
    icon: Plus,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type !== "notebook") return;
      AddNotebookDialog.show({ parentId: context.id });
    },
    group: getLabelForActiveNotebookGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return (
        context?.type !== "notebook" || !context.item || context.item.deleted
      );
    },
    dynamic: true
  },
  {
    id: "edit-active-notebook",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "notebook" ? strings.edit() : undefined;
    },
    icon: NotebookEdit,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type !== "notebook") return;
      hashNavigate(`/notebooks/${context.id}/edit`);
    },
    group: getLabelForActiveNotebookGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return (
        context?.type !== "notebook" || !context.item || context.item.deleted
      );
    },
    dynamic: true
  },
  {
    id: "pin-active-notebook",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "notebook"
        ? context.item?.pinned
          ? strings.unpin()
          : strings.pin()
        : undefined;
    },
    icon: Pin,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type !== "notebook") return;
      notebookStore.pin(!context.item?.pinned, context.id);
    },
    group: getLabelForActiveNotebookGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return context?.type !== "notebook";
    },
    dynamic: true
  },
  {
    id: "add-shortcut-active-notebook",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "notebook" && context.item
        ? db.shortcuts.exists(context.item.id)
          ? strings.removeShortcut()
          : strings.addShortcut()
        : undefined;
    },
    icon: Shortcut,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type !== "notebook" || !context.item) return;
      appStore.addToShortcuts(context.item);
    },
    group: getLabelForActiveNotebookGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return context?.type !== "notebook";
    },
    dynamic: true
  },
  {
    id: "move-to-trash-active-notebook",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "notebook" ? strings.moveToTrash() : undefined;
    },
    icon: Trash,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type !== "notebook") return;
      Multiselect.moveNotebooksToTrash([context.id]).then(() => {
        navigate("/notebooks");
      });
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
      return context?.type === "tag" ? strings.rename() : undefined;
    },
    icon: Edit,
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
    id: "add-shortcut-active-tag",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "tag" && context.item
        ? db.shortcuts.exists(context.item.id)
          ? strings.removeShortcut()
          : strings.addShortcut()
        : undefined;
    },
    icon: Shortcut,
    action: () => {
      const context = noteStore.get().context;
      if (context?.type !== "tag" || !context.item) return;
      appStore.addToShortcuts(context.item);
    },
    group: getLabelForActiveTagGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return context?.type !== "tag";
    },
    dynamic: true
  },
  {
    id: "delete-active-tag",
    title: () => {
      const context = noteStore.get().context;
      return context?.type === "tag" ? strings.delete() : undefined;
    },
    icon: DeleteForver,
    action: () => {
      const context = noteStore.get().context;
      if (!context || context.type !== "tag" || !context.item) return;
      Multiselect.deleteTags([context.item.id]);
    },
    group: getLabelForActiveTagGroup,
    hidden: () => {
      const context = noteStore.get().context;
      return context?.type !== "tag";
    },
    dynamic: true
  },
  {
    id: "undo",
    title: strings.undo(),
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.undo();
    },
    group: strings.editor(),
    hidden: () => {
      const session = useEditorStore.getState().getActiveSession();
      return (
        !session ||
        !useEditorManager.getState().editors[session.id].canUndo ||
        session.type === "readonly"
      );
    },
    dynamic: true
  },
  {
    id: "redo",
    title: strings.redo(),
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.redo();
    },
    group: strings.editor(),
    hidden: () => {
      const session = useEditorStore.getState().getActiveSession();
      return (
        !session ||
        !useEditorManager.getState().editors[session.id].canRedo ||
        session.type === "readonly"
      );
    },
    dynamic: true
  },
  {
    id: "next-tab",
    title: strings.nextTab(),
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().focusNextTab(),
    group: strings.navigate()
  },
  {
    id: "previous-tab",
    title: strings.previousTab(),
    icon: ArrowTopRight,
    action: () => useEditorStore.getState().focusPreviousTab(),
    group: strings.navigate()
  },
  {
    id: "go-forward-in-tab",
    title: strings.goForwardInTab(),
    icon: ArrowRight,
    action: () => useEditorStore.getState().goForward(),
    group: strings.navigate()
  },
  {
    id: "go-back-in-tab",
    title: strings.goBackInTab(),
    icon: ArrowLeft,
    action: () => useEditorStore.getState().goBack(),
    group: strings.navigate()
  },
  {
    id: "notes",
    title: strings.dataTypesPluralCamelCase.note(),
    icon: ArrowTopRight,
    action: () => navigate("/"),
    group: strings.navigate()
  },
  {
    id: "notebooks",
    title: strings.dataTypesPluralCamelCase.notebook(),
    icon: ArrowTopRight,
    action: () => navigate("/notebooks"),
    group: strings.navigate()
  },
  {
    id: "tags",
    title: strings.dataTypesPluralCamelCase.tag(),
    icon: ArrowTopRight,
    action: () => navigate("/tags"),
    group: strings.navigate()
  },
  {
    id: "favorites",
    title: strings.dataTypesPluralCamelCase.favorite(),
    icon: ArrowTopRight,
    action: () => navigate("/favorites"),
    group: strings.navigate()
  },
  {
    id: "reminders",
    title: strings.dataTypesPluralCamelCase.reminder(),
    icon: ArrowTopRight,
    action: () => navigate("/reminders"),
    group: strings.navigate()
  },
  {
    id: "monographs",
    title: strings.dataTypesPluralCamelCase.monograph(),
    icon: ArrowTopRight,
    action: () => navigate("/monographs"),
    group: strings.navigate()
  },
  {
    id: "trash",
    title: strings.trash(),
    icon: ArrowTopRight,
    action: () => navigate("/trash"),
    group: strings.navigate()
  },
  {
    id: "settings",
    title: strings.settings(),
    icon: ArrowTopRight,
    action: () => hashNavigate("/settings", { replace: true }),
    group: strings.navigate()
  },
  {
    id: "help",
    title: strings.helpAndSupport(),
    icon: ArrowTopRight,
    action: () => (window.location.href = "https://help.notesnook.com"),
    group: strings.navigate()
  },
  {
    id: "attachment-manager",
    title: strings.attachmentManager(),
    icon: ArrowTopRight,
    action: () => AttachmentsDialog.show({}),
    group: strings.navigate()
  },
  {
    id: "new-tab",
    title: strings.newTab(),
    icon: Plus,
    action: () => useEditorStore.getState().addTab(),
    group: strings.create()
  },
  {
    id: "new-note",
    title: strings.newNote(),
    icon: Plus,
    action: () => useEditorStore.getState().newSession(),
    group: strings.create()
  },
  {
    id: "new-notebook",
    title: strings.newNotebook(),
    icon: Plus,
    action: () => hashNavigate("/notebooks/create", { replace: true }),
    group: strings.create()
  },
  {
    id: "new-tag",
    title: strings.newTag(),
    icon: Plus,
    action: () => hashNavigate("/tags/create", { replace: true }),
    group: strings.create()
  },
  {
    id: "new-reminder",
    title: strings.newReminder(),
    icon: Plus,
    action: () => hashNavigate(`/reminders/create`, { replace: true }),
    group: strings.create()
  },
  {
    id: "new-color",
    title: strings.newColor(),
    icon: Plus,
    action: () => CreateColorDialog.show(true),
    group: strings.create()
  },
  {
    id: "close-tab",
    title: strings.closeCurrentTab(),
    icon: Radar,
    action: () => useEditorStore.getState().closeActiveTab(),
    group: strings.general()
  },
  {
    id: "close-all-tabs",
    title: strings.closeAllTabs(),
    icon: Radar,
    action: () => useEditorStore.getState().closeAllTabs(),
    group: strings.general()
  },
  {
    id: "toggle-theme",
    title: strings.toggleTheme(),
    icon: Radar,
    action: () => useThemeStore.getState().toggleColorScheme(),
    group: strings.general()
  }
];
