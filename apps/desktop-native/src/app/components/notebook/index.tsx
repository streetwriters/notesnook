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

import { areFeaturesAvailable } from "@notesnook/common";
import {
  createInternalLink,
  type Notebook as NotebookType
} from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Text,
  type MenuItem,
  type UIMouseEvent
} from "@notesnook/ui-kit";
import ListItem from "../list-item";
import {
  ArrowCounterClockwise,
  ArrowsInCardinal,
  ArrowUp,
  CaretDown,
  Copy,
  LinkBreak,
  LinkHorizontal,
  LinkSimple,
  Notebook as NotebookIcon,
  PencilSimple,
  Plus,
  Trash
} from "../icons";
import { hashNavigate, navigate } from "../../navigation";
import { db } from "../../common/db";
import {
  createSetDefaultHomepageMenuItem,
  withFeatureCheck
} from "../../common";
import { Multiselect } from "../../common/multi-select";
import { AddNotebookDialog } from "../../dialogs/add-notebook-dialog";
import { MoveNotebookDialog } from "../../dialogs/move-notebook-dialog";
import { store as appStore } from "../../stores/app-store";
import { useStore as useNotebookStore } from "../../stores/notebook-store";
import { useStore as useNotesStore } from "../../stores/note-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { store as settingStore } from "../../stores/setting-store";
import { handleDrop } from "../../common/drop-handler";
import { useDragHandler } from "../../hooks/use-drag-handler";
import { writeToClipboard } from "../../utils/clipboard";
import { showToast } from "../../utils/toast";

// The kit takes no theme callbacks in sx: these are spacing2, spacing3 and the
// caret size that web's callback reads from the theme.
const ICON_SIZE = 11;
const SPACING2 = 5;
const SPACING3 = 7;

type NotebookProps = {
  item: NotebookType;
  totalNotes?: number;
  isExpandable?: boolean;
  isExpanded?: boolean;
  expand?: () => void;
  collapse?: () => void;
  refresh?: () => void;
  depth?: number;
  index?: number;
  select?: (event?: UIMouseEvent) => void;
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
    depth = 0,
    select = () => {}
  } = props;
  const context = useNotesStore((store) => store.context);
  const isOpened = context?.type === "notebook" && context.id === item.id;
  const contextNotes = useNotesStore((store) => store.contextNotes);
  const currentContext = isOpened ? contextNotes : null;
  const dragTimeout = useRef(0);
  const { isDragEntering, isDragLeaving } = useDragHandler(`id_${item.id}`);

  return (
    <ListItem
      draggable
      isFocused={isOpened}
      isCompact
      item={item}
      index={props.index}
      onClick={(e) => {
        select(e);
        navigate(`/notebooks/${item.id}`);
      }}
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
        <Flex sx={{ alignItems: "center", gap: "spacing3", minWidth: 0 }}>
          {isExpandable ? (
            <Button
              variant="secondary"
              data-test-id="notebook-expand"
              sx={{
                bg: "transparent",
                p: 0,
                borderRadius: "radius1",
                width: 11,
                height: 11
              }}
              onClick={(e) => {
                e.stopPropagation();
                select(e);
                isExpanded ? collapse() : expand();
              }}
            >
              <CaretDown
                size={11}
                color={isOpened ? "icon-selected" : "icon"}
                sx={{ transform: isExpanded ? undefined : "rotate(-90deg)" }}
              />
            </Button>
          ) : (
            <Box sx={{ width: 11, height: 11 }} />
          )}
          {depth === 0 ? (
            <NotebookIcon
              size={13}
              color={isOpened ? "icon-selected" : "icon"}
            />
          ) : null}
          <Text
            data-test-id={`title`}
            variant={"body"}
            color={isOpened ? "paragraph-selected" : "paragraph"}
            sx={{
              whiteSpace: "pre",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: "normal",
              fontSize: "xs",
              minWidth: 0
            }}
          >
            {item.title}
          </Text>
        </Flex>
      }
      footer={
        <Text
          variant="subBody"
          color={isOpened ? "paragraph" : "paragraph-secondary"}
          sx={{ fontSize: "3xs", lineHeight: 1 }}
        >
          {currentContext ? currentContext?.length : totalNotes}
        </Text>
      }
      menuItems={notebookMenuItems}
      context={{ refresh, isRoot: depth === 0 }}
      sx={{
        pr: "spacing2",
        py: "spacing4",
        borderRadius: "radius1",
        height: "100%",
        mb: "spacing1",
        pl: depth === 0 ? SPACING2 : SPACING2 + (depth * ICON_SIZE + SPACING3)
      }}
    />
  );
}

export const notebookMenuItems: (
  notebook: NotebookType,
  ids?: string[],
  context?: { refresh?: () => void; isRoot?: boolean }
) => Promise<MenuItem[]> = async (notebook, ids = [], context) => {
  const defaultNotebook = db.settings.getDefaultNotebook();
  const features = await areFeaturesAvailable([
    "shortcuts",
    "defaultNotebookAndTag",
    "customHomepage"
  ]);
  return [
    {
      type: "button",
      key: "add",
      title: strings.newNotebook(),
      iconComponent: Plus,
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
      iconComponent: PencilSimple,
      onClick: () => hashNavigate(`/notebooks/${notebook.id}/edit`)
    },
    {
      type: "button",
      key: "set-as-default",
      title: strings.setAsDefault(),
      isChecked: defaultNotebook === notebook.id,
      iconComponent: ArrowCounterClockwise,
      premium: !features.defaultNotebookAndTag.isAllowed,
      onClick: withFeatureCheck(features.defaultNotebookAndTag, async () => {
        const defaultNotebook = db.settings.getDefaultNotebook();
        const isDefault = defaultNotebook === notebook.id;
        await db.settings.setDefaultNotebook(
          isDefault ? undefined : notebook.id
        );
      })
    },
    createSetDefaultHomepageMenuItem(
      notebook.id,
      notebook.type,
      features.customHomepage
    ),
    {
      type: "button",
      key: "shortcut",
      iconComponent: db.shortcuts.exists(notebook.id) ? LinkBreak : LinkSimple,
      title: db.shortcuts.exists(notebook.id)
        ? strings.removeShortcut()
        : strings.addShortcut(),
      premium: !features.shortcuts.isAllowed,
      onClick: withFeatureCheck(features.shortcuts, () =>
        appStore.addToShortcuts(notebook)
      )
    },
    { key: "sep1", type: "separator" },
    {
      type: "button",
      key: "move",
      iconComponent: ArrowsInCardinal,
      title: strings.move(),
      onClick: () => {
        MoveNotebookDialog.show({ notebook: notebook });
      }
    },
    {
      type: "button",
      key: "copy-link",
      title: strings.copyLink(),
      iconComponent: LinkHorizontal,
      onClick: () => {
        const link = createInternalLink("notebook", notebook.id);
        writeToClipboard({
          "text/plain": link,
          "text/html": `<a href="${link}">${notebook.title}</a>`,
          "text/markdown": `[${notebook.title}](${link})`
        });
      }
    },
    {
      type: "button",
      key: "move-to-top",
      iconComponent: ArrowUp,
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
      iconComponent: Trash,
      onClick: () => Multiselect.moveNotebooksToTrash(ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "copyid",
      title: strings.copyId(),
      iconComponent: Copy,
      onClick: async () => {
        try {
          await writeToClipboard({
            "text/plain": notebook.id
          });
          showToast("success", strings.notebookIdCopied());
        } catch (e) {
          console.error(e);
          showToast("error", strings.failedToCopyToClipboard());
        }
      },
      isHidden: !settingStore.get().isInboxEnabled
    }
  ];
};
