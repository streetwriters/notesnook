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
import { Box, Button, Flex, Text, type MenuItem, type PressEvent } from "@ui";
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
import { writeToClipboard } from "../../utils/clipboard";
import { showToast } from "../../utils/toast";

const ICON_SIZE = 11;
const SPACING2 = 5;
const SPACING3 = 7;

type NotebookProps = {
  item: NotebookType;
  index?: number;
  totalNotes?: number;
  isExpandable?: boolean;
  isExpanded?: boolean;
  expand?: () => void;
  collapse?: () => void;
  refresh?: () => void;
  select?: (event?: PressEvent) => void;
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
    depth = 0,
    select = () => {}
  } = props;
  const context = useNotesStore((store) => store.context);
  const isOpened = context?.type === "notebook" && context.id === item.id;
  const contextNotes = useNotesStore((store) => store.contextNotes);
  const currentContext = isOpened ? contextNotes : null;

  return (
    <ListItem
      index={props.index}
      isFocused={isOpened}
      isCompact
      item={item}
      menuItems={notebookMenuItems}
      context={{ refresh, isRoot: depth === 0 }}
      onKeyPress={async (e) => {
        if (e.key === " ") {
          e.stopPropagation();
          if (isExpandable) isExpanded ? collapse() : expand();
          else navigate(`/notebooks/${item.id}`);
        } else if (e.key === "Delete") {
          e.stopPropagation();
          await Multiselect.moveNotebooksToTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      onPress={(event) => {
        select(event);
        navigate(`/notebooks/${item.id}`, { notify: true });
      }}
      title={
        <Flex
          sx={{
            flexDirection: "row",
            alignItems: "center",
            gap: "spacing3",
            minWidth: 0
          }}
        >
          {isExpandable ? (
            <Button
              testID="notebook-expand"
              variant="secondary"
              onPress={(event) => {
                select(event);
                if (isExpanded) collapse();
                else expand();
              }}
              sx={{
                bg: "transparent",
                p: 0,
                borderRadius: "radius1",
                width: ICON_SIZE,
                height: ICON_SIZE,
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <CaretDown
                size={ICON_SIZE}
                color={isOpened ? "icon-selected" : "icon"}
                rotate={isExpanded ? undefined : -90}
              />
            </Button>
          ) : (
            <Box sx={{ width: ICON_SIZE, height: ICON_SIZE }} />
          )}
          {depth === 0 ? (
            <NotebookIcon
              size={13}
              color={isOpened ? "icon-selected" : "icon"}
            />
          ) : null}
          <Text
            testID="title"
            variant="body"
            numberOfLines={1}
            sx={{
              color: isOpened ? "paragraph-selected" : "paragraph",
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
          sx={{
            fontSize: "3xs",
            lineHeight: 1,
            color: isOpened ? "paragraph" : "paragraph-secondary"
          }}
        >
          {currentContext ? currentContext.length : totalNotes}
        </Text>
      }
      sx={{
        pr: "spacing2",
        py: "spacing4",
        borderRadius: "radius1",
        mb: "spacing1",
        pl: `${
          depth === 0 ? SPACING2 : SPACING2 + (depth * ICON_SIZE + SPACING3)
        }px`
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
        AddNotebookDialog.show({ parentId: notebook.id }).then((res: boolean) =>
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
