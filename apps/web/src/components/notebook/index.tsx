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

import ListItem from "../list-item";
import { Button, Flex, Text } from "@theme-ui/components";
import { useStore as useNotesStore } from "../../stores/note-store";
import { Notebook as NotebookType } from "@notesnook/core";
import {
  ChevronDown,
  ChevronRight,
  NotebookEdit,
  Plus,
  RemoveShortcutLink,
  Shortcut,
  Trash,
  Notebook as NotebookIcon,
  ArrowUp,
  Move
} from "../icons";
import { MenuItem } from "@notesnook/ui";
import { hashNavigate, navigate } from "../../navigation";
import { useRef } from "react";
import { handleDrop } from "../../common/drop-handler";
import { useDragHandler } from "../../hooks/use-drag-handler";
import { AddNotebookDialog } from "../../dialogs/add-notebook-dialog";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { store as appStore } from "../../stores/app-store";
import { Multiselect } from "../../common/multi-select";
import { strings } from "@notesnook/intl";
import { db } from "../../common/db";
import { createSetDefaultHomepageMenuItem } from "../../common";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { MoveNotebookDialog } from "../../dialogs/move-notebook-dialog";
import { isFeatureAvailable } from "@notesnook/common";
import { showFeatureNotAllowedToast } from "../../common/toasts";

type NotebookProps = {
  item: NotebookType;
  totalNotes?: number;
  isExpandable?: boolean;
  isExpanded?: boolean;
  expand?: () => void;
  collapse?: () => void;
  refresh?: () => void;
  depth?: number;
};
export function Notebook(props: NotebookProps) {
  const {
    item,
    totalNotes = 0,
    isExpandable = false,
    isExpanded = false,
    expand = () => {},
    collapse = () => {},
    refresh = () => {},
    depth = 0
  } = props;
  const currentContext = useNotesStore((store) =>
    store.context?.type === "notebook" && store.context.id === item.id
      ? store.contextNotes
      : null
  );
  const isOpened = !!currentContext;
  const dragTimeout = useRef(0);
  const { isDragEntering, isDragLeaving } = useDragHandler(`id_${item.id}`);

  return (
    <ListItem
      draggable
      isFocused={isOpened}
      isCompact
      item={item}
      onClick={() => navigate(`/notebooks/${item.id}`)}
      onDragEnter={(e) => {
        if (!isDragEntering(e)) return;
        e.currentTarget.focus();

        dragTimeout.current = setTimeout(() => {
          expand();
        }, 700) as unknown as number;
      }}
      onDragLeave={(e) => {
        if (!isDragLeaving(e)) return;
        clearTimeout(dragTimeout.current);
      }}
      onDrop={async (e) => {
        clearTimeout(dragTimeout.current);
        handleDrop(e.dataTransfer, item);
      }}
      onKeyPress={async (e) => {
        if (e.code === "Space") {
          e.stopPropagation();
          if (isExpandable) isExpanded ? collapse() : expand();
          else navigate(`/notebooks/${item.id}`);
        } else if (e.code === "Delete") {
          e.stopPropagation();
          await Multiselect.moveNotebooksToTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      title={
        <Flex
          sx={{ alignItems: "center", justifyContent: "center", gap: "small" }}
        >
          {isExpandable ? (
            <Button
              variant="secondary"
              sx={{ bg: "transparent", p: 0, borderRadius: 100 }}
              onClick={(e) => {
                e.stopPropagation();
                isExpanded ? collapse() : expand();
              }}
            >
              {isExpanded ? (
                <ChevronDown
                  size={14}
                  color={isOpened ? "icon-selected" : "icon"}
                />
              ) : (
                <ChevronRight
                  size={14}
                  color={isOpened ? "icon-selected" : "icon"}
                />
              )}
            </Button>
          ) : (
            <NotebookIcon
              size={14}
              color={isOpened ? "icon-selected" : "icon"}
            />
          )}
          <Text
            data-test-id={`title`}
            variant={"body"}
            color={isOpened ? "paragraph-selected" : "paragraph"}
            sx={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: "body",
              display: "block"
            }}
          >
            {item.title}
          </Text>
        </Flex>
      }
      footer={
        <Text variant="subBody">
          {currentContext ? currentContext?.length : totalNotes}
        </Text>
      }
      menuItems={notebookMenuItems}
      context={{ refresh, isRoot: depth === 0 }}
      sx={{
        mb: "small",
        borderRadius: "default",
        paddingLeft: `${5 + (depth === 0 ? 0 : 15 * depth)}px`
      }}
    />
  );
}

export const notebookMenuItems: (
  notebook: NotebookType,
  ids?: string[],
  context?: { refresh?: () => void; isRoot?: boolean }
) => MenuItem[] = (notebook, ids = [], context) => {
  const defaultNotebook = db.settings.getDefaultNotebook();
  return [
    {
      type: "button",
      key: "add",
      title: strings.newNotebook(),
      icon: Plus.path,
      onClick: () =>
        AddNotebookDialog.show({ parentId: notebook.id }).then((res) =>
          res ? context?.refresh?.() : null
        )
    },
    { type: "separator", key: "sep0" },
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
        if (!isDefault) {
          const result = await isFeatureAvailable("defaultNotebookAndTag");
          if (!result.isAllowed) return showFeatureNotAllowedToast(result);
        }
        await db.settings.setDefaultNotebook(
          isDefault ? undefined : notebook.id
        );
      }
    },
    {
      type: "lazy-loader",
      key: "sidebar-items-loader",
      items: async () => [
        createSetDefaultHomepageMenuItem(notebook.id, notebook.type)
      ]
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
    { key: "sep1", type: "separator" },
    {
      type: "button",
      key: "move",
      icon: Move.path,
      title: strings.move(),
      onClick: () => {
        MoveNotebookDialog.show({ notebook: notebook });
      }
    },
    {
      type: "button",
      key: "move-to-top",
      icon: ArrowUp.path,
      title: strings.moveToTop(),
      isHidden: context?.isRoot,
      onClick: async () => {
        if (context?.isRoot) return;

        const parentId = await db.notebooks.parentId(notebook.id);
        if (!parentId) return;

        await db.relations.unlink(
          {
            type: "notebook",
            id: parentId
          },
          notebook
        );
        await useNotebookStore.getState().refresh();
      },
      multiSelect: false
    },
    { key: "sep2", type: "separator" },
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
