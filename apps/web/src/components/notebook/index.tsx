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

import React, { useRef } from "react";
import { Flex, Text } from "@theme-ui/components";
import ListItem from "../list-item";
import { store } from "../../stores/notebook-store";
import { useStore as useNotesStore } from "../../stores/note-store";
import { store as appStore } from "../../stores/app-store";
import { db } from "../../common/db";
import {
  Topic as TopicIcon,
  PinFilled,
  NotebookEdit,
  Notebook as NotebookIcon,
  Pin,
  RemoveShortcutLink,
  Shortcut,
  Trash
} from "../icons";
import { hashNavigate, navigate } from "../../navigation";
import IconTag from "../icon-tag";
import { Multiselect } from "../../common/multi-select";
import { getFormattedDate } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { Notebook as NotebookType } from "@notesnook/core";
import { handleDrop } from "../../common/drop-handler";
import { useDragHandler } from "../../hooks/use-drag-handler";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { strings } from "@notesnook/intl";

type NotebookProps = {
  item: NotebookType;
  totalNotes: number;
  date: number;
  compact?: boolean;
};
function Notebook(props: NotebookProps) {
  const { item, totalNotes, date, compact } = props;
  const notebook = item;
  const dragTimeout = useRef(0);
  const { isDragEntering, isDragLeaving } = useDragHandler(`id_${notebook.id}`);

  return (
    <ListItem
      draggable
      isCompact={compact}
      item={notebook}
      onClick={() => openNotebook(notebook, totalNotes)}
      onDragEnter={(e) => {
        if (!isDragEntering(e)) return;
        e.currentTarget.focus();
        dragTimeout.current = setTimeout(
          () => openNotebook(notebook, totalNotes),
          1000
        ) as unknown as number;
      }}
      onDragLeave={(e) => {
        if (!isDragLeaving(e)) return;
        clearTimeout(dragTimeout.current);
      }}
      onDrop={async (e) => {
        clearTimeout(dragTimeout.current);

        handleDrop(e.dataTransfer, notebook);
      }}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.moveNotebooksToTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      title={notebook.title}
      body={notebook.description as string}
      menuItems={notebookMenuItems}
      footer={
        <>
          {compact ? (
            <>
              <Text variant="subBody">{strings.notes(totalNotes)}</Text>
            </>
          ) : (
            <>
              {notebook?.topics && (
                <Flex mb={1} sx={{ gap: 1 }}>
                  {notebook.topics.slice(0, 3).map((topic) => (
                    <IconTag
                      key={topic.id}
                      text={topic.title}
                      icon={TopicIcon}
                      onClick={() => {
                        navigate(`/notebooks/${notebook.id}/${topic.id}`);
                      }}
                    />
                  ))}
                </Flex>
              )}
              <Flex
                sx={{
                  fontSize: "subBody",
                  color: "var(--paragraph-secondary)",
                  alignItems: "center",
                  fontFamily: "body"
                }}
              >
                {notebook.pinned && (
                  <PinFilled color="accent" size={13} sx={{ mr: 1 }} />
                )}

                {getFormattedDate(date, "date")}
                <Text as="span" mx={1} sx={{ color: "inherit" }}>
                  •
                </Text>
                <Text sx={{ color: "inherit" }}>
                  {strings.notes(totalNotes)}
                </Text>
              </Flex>
            </>
          )}
        </>
      }
    />
  );
}
export default React.memo(Notebook, (prev, next) => {
  const prevItem = prev.item;
  const nextItem = next.item;

  return (
    prev.date === next.date &&
    prevItem.pinned === nextItem.pinned &&
    prevItem.title === nextItem.title &&
    prevItem.description === nextItem.description &&
    prev.totalNotes === next.totalNotes &&
    prev.compact === next.compact
  );
});

export const notebookMenuItems: (
  notebook: NotebookType,
  ids?: string[]
) => MenuItem[] = (notebook, ids = []) => {
  const defaultNotebook = db.settings.getDefaultNotebook();

  return [
    {
      type: "button",
      key: "edit",
      title: strings.edit(),
      icon: NotebookEdit.path,
      onClick: () => hashNavigate(`/notebooks/${notebook.id}/edit`)
    },
    {
      type: "button",
      key: "set-as-default",
      title: strings.setAsDefault(),
      isChecked: defaultNotebook === notebook.id,
      icon: NotebookIcon.path,
      onClick: async () => {
        const defaultNotebook = db.settings.getDefaultNotebook();
        const isDefault = defaultNotebook === notebook.id;
        await db.settings.setDefaultNotebook(
          isDefault ? undefined : notebook.id
        );
      }
    },
    {
      type: "button",
      key: "pin",
      icon: Pin.path,
      title: strings.pin(),
      isChecked: notebook.pinned,
      onClick: () => store.pin(!notebook.pinned, ...ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "shortcut",
      icon: db.shortcuts.exists(notebook.id)
        ? RemoveShortcutLink.path
        : Shortcut.path,
      title: db.shortcuts.exists(notebook.id)
        ? strings.removeShortcut()
        : strings.addShortcut(),
      onClick: () => appStore.addToShortcuts(notebook)
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "movetotrash",
      title: strings.moveToTrash(),
      variant: "dangerous",
      icon: Trash.path,
      onClick: () => Multiselect.moveNotebooksToTrash(ids),
      multiSelect: true
    }
  ];
};

async function openNotebook(notebook: NotebookType, totalNotes?: number) {
  await useNotesStore.getState().setContext({
    type: "notebook",
    id: notebook.id,
    item: notebook,
    totalNotes: totalNotes
  });
  navigate(`/notebooks/${notebook.id}`);
}
