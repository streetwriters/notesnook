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
  const text = "Actions for ";
  const note = useEditorStore.getState().getActiveNote();
  return note ? `${text} note: ${note.title}` : undefined;
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
    id: "pin-active-note",
    title: () => {
      const note = useEditorStore.getState().getActiveNote();
      return note ? (note.pinned ? "Unpin" : "Pin") : undefined;
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
      return note ? "Toggle readonly" : undefined;
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
      return note ? (note.favorite ? "Unfavorite" : "Favorite") : undefined;
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
      return note ? "Remind me" : undefined;
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
      return note ? "Link notebooks" : undefined;
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
      return note ? "Add tags" : undefined;
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
      return note ? "Publish on monograph" : undefined;
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
      return note ? "Open in monograph" : undefined;
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
      return note ? "Copy monograph link" : undefined;
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
          ? "Turn sync on"
          : "Turn sync off"
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
      return note ? "Unpublish on monograph" : undefined;
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
      return note ? "Copy link" : undefined;
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
    title: () => "Duplicate",
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
      return note ? "Move to trash" : undefined;
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
      return note ? "Restore" : undefined;
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
      return note ? "Delete" : undefined;
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
      return context?.type === "notebook" ? "Add subnotebook" : undefined;
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
      return context?.type === "notebook" ? "Edit" : undefined;
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
          ? "Unpin"
          : "Pin"
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
          ? "Remove shortcut"
          : "Add shortcut"
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
      return context?.type === "notebook" ? "Move to trash" : undefined;
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
      return context?.type === "tag" ? "Rename" : undefined;
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
          ? "Remove shortcut"
          : "Add shortcut"
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
      return context?.type === "tag" ? "Delete" : undefined;
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
    title: "Undo",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.undo();
    },
    group: "Editor",
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
    title: "Redo",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.redo();
    },
    group: "Editor",
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
    id: "toggle-bold",
    title: "Toggle bold",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleBold();
    },
    group: "Editor"
  },
  {
    id: "toggle-italic",
    title: "Toggle italic",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleItalic();
    },
    group: "Editor"
  },
  {
    id: "toggle-underline",
    title: "Toggle underline",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleUnderline();
    },
    group: "Editor"
  },
  {
    id: "toggle-strike",
    title: "Toggle strike",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleStrike();
    },
    group: "Editor"
  },
  {
    id: "toggle-code",
    title: "Toggle code",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleCode();
    },
    group: "Editor"
  },
  {
    id: "toggle-subscript",
    title: "Toggle subscript",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleSubscript();
    },
    group: "Editor"
  },
  {
    id: "toggle-superscript",
    title: "Toggle superscript",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager
        .getState()
        .editors[session.id].editor?.toggleSuperscript();
    },
    group: "Editor"
  },
  {
    id: "toggle-bullet-list",
    title: "Toggle bullet list",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager
        .getState()
        .editors[session.id].editor?.toggleBulletList();
    },
    group: "Editor"
  },
  {
    id: "toggle-ordered-list",
    title: "Toggle ordered list",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager
        .getState()
        .editors[session.id].editor?.toggleOrderedList();
    },
    group: "Editor"
  },
  {
    id: "toggle-task-list",
    title: "Toggle task list",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleTaskList();
    },
    group: "Editor"
  },
  {
    id: "toggle-outline-list",
    title: "Toggle outline list",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager
        .getState()
        .editors[session.id].editor?.toggleOutlineList();
    },
    group: "Editor"
  },
  {
    id: "insert-horizontal-rule",
    title: "Insert horizontal rule",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager
        .getState()
        .editors[session.id].editor?.insertHorizontalRule();
    },
    group: "Editor"
  },
  {
    id: "toggle-code-block",
    title: "Toggle code block",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.toggleCodeBlock();
    },
    group: "Editor"
  },
  {
    id: "toggle-math-block",
    title: "Toggle math block",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.insertMathBlock();
    },
    group: "Editor"
  },
  {
    id: "insert-quote-block",
    title: "Insert quote block",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager
        .getState()
        .editors[session.id].editor?.toggleQuoteBlock();
    },
    group: "Editor"
  },
  {
    id: "add-attachment",
    title: "Add attachment",
    icon: Editor,
    action: () => {
      const session = useEditorStore.getState().getActiveSession();
      if (!session) return;
      useEditorManager.getState().editors[session.id].editor?.addAttachment();
    },
    group: "Editor"
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
    id: "go-forward-in-tab",
    title: "Go forward in tab",
    icon: ArrowRight,
    action: () => useEditorStore.getState().goForward(),
    group: "Navigate"
  },
  {
    id: "go-back-in-tab",
    title: "Go back in tab",
    icon: ArrowLeft,
    action: () => useEditorStore.getState().goBack(),
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
    id: "new-tab",
    title: "New tab",
    icon: Plus,
    action: () => useEditorStore.getState().addTab(),
    group: "Create"
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
    action: () => useEditorStore.getState().closeActiveTab(),
    group: "General"
  },
  {
    id: "close-all-tabs",
    title: "Close all tabs",
    icon: Radar,
    action: () => useEditorStore.getState().closeAllTabs(),
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
