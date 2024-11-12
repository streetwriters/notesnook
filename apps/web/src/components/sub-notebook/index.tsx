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
import { Flex, Text } from "@theme-ui/components";
import { useStore as useNotesStore } from "../../stores/note-store";
import { Notebook } from "@notesnook/core";
import { notebookMenuItems } from "../notebook";
import { ChevronDown, ChevronRight, Plus } from "../icons";
import { MenuItem } from "@notesnook/ui";
import { navigate } from "../../navigation";
import { useCallback, useRef } from "react";
import { handleDrop } from "../../common/drop-handler";
import { useDragHandler } from "../../hooks/use-drag-handler";
import { AddNotebookDialog } from "../../dialogs/add-notebook-dialog";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { Multiselect } from "../../common/multi-select";
import { strings } from "@notesnook/intl";

type SubNotebookProps = {
  item: Notebook;
  totalNotes: number;
  isExpandable: boolean;
  isExpanded: boolean;
  expand: () => void;
  collapse: () => void;
  refresh?: () => void;
  depth: number;
  rootId: string;
};
function SubNotebook(props: SubNotebookProps) {
  const {
    item,
    totalNotes,
    isExpandable,
    isExpanded,
    expand,
    collapse,
    refresh,
    depth,
    rootId
  } = props;
  const isOpened = useNotesStore(
    (store) =>
      store.context?.type === "notebook" && store.context.id === item.id
  );
  const dragTimeout = useRef(0);
  const { isDragEntering, isDragLeaving } = useDragHandler(`id_${item.id}`);

  const openNotebook = useCallback(async () => {
    if (isOpened) return;
    focus();
    expand();
    await useNotesStore.getState().setContext({
      type: "notebook",
      id: item.id,
      item,
      totalNotes
    });
    navigate(`/notebooks/${rootId}/${item.id}`);
  }, [expand, focus, isOpened, item, rootId, totalNotes]);

  return (
    <ListItem
      draggable
      isFocused={isOpened}
      isCompact
      item={item}
      onClick={() => openNotebook()}
      onDragEnter={(e) => {
        if (!isDragEntering(e)) return;
        e.currentTarget.focus();
        focus();

        dragTimeout.current = setTimeout(() => {
          openNotebook();
        }, 1000) as unknown as number;
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
          else if (!isOpened) {
            focus();
            await useNotesStore.getState().setContext({
              type: "notebook",
              id: item.id,
              item,
              totalNotes
            });
            navigate(`/notebooks/${rootId}/${item.id}`);
          }
        } else if (e.code === "Delete") {
          e.stopPropagation();
          await Multiselect.moveNotebooksToTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      title={
        <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
          {isExpandable ? (
            isExpanded ? (
              <ChevronDown
                size={16}
                onClick={(e) => {
                  e.stopPropagation();
                  collapse();
                }}
              />
            ) : (
              <ChevronRight
                size={16}
                onClick={(e) => {
                  e.stopPropagation();
                  expand();
                }}
              />
            )
          ) : null}
          <Text
            data-test-id={`title`}
            variant={"body"}
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
      footer={<Text variant="subBody">{totalNotes}</Text>}
      menuItems={subNotebookMenuItems}
      context={{ refresh }}
      sx={{
        paddingLeft:
          depth === 0
            ? isExpandable
              ? 0
              : "5px"
            : `${16 * depth - (isExpandable ? 5 : 0)}px`
      }}
    />
  );
}

export default SubNotebook;

const subNotebookMenuItems: (
  notebook: Notebook,
  ids?: string[],
  context?: { refresh?: () => void }
) => MenuItem[] = (notebook, ids = [], context) => {
  const menuItems = notebookMenuItems(notebook, ids);
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
    { type: "separator", key: "sepep2" },
    ...menuItems
  ];
};
