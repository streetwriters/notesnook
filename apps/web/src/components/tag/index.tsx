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
import { navigate } from "../../navigation";
import { Flex, Text } from "@theme-ui/components";
import { store as appStore } from "../../stores/app-store";
import { db } from "../../common/db";
import { Edit, Shortcut, DeleteForver, Tag as TagIcon } from "../icons";
import { MenuItem } from "@notesnook/ui";
import { Tag as TagType } from "@notesnook/core";
import { handleDrop } from "../../common/drop-handler";
import { EditTagDialog } from "../../dialogs/item-dialog";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { useStore as useNoteStore } from "../../stores/note-store";
import { Multiselect } from "../../common/multi-select";
import { strings } from "@notesnook/intl";
import { createSetDefaultHomepageMenuItem } from "../../common";
import { isFeatureAvailable } from "@notesnook/common";
import { showFeatureNotAllowedToast } from "../../common/toasts";

type TagProps = { item: TagType; totalNotes: number };
function Tag(props: TagProps) {
  const { item, totalNotes } = props;
  const { id } = item;
  const currentContext = useNoteStore((store) =>
    store.context?.type === "tag" && store.context.id === id
      ? store.contextNotes
      : null
  );
  const isSelected = !!currentContext;

  return (
    <ListItem
      item={item}
      isCompact
      isFocused={isSelected}
      sx={{
        borderRadius: "default",
        mb: "small"
      }}
      title={
        <Flex
          sx={{ alignItems: "center", justifyContent: "center", gap: "small" }}
        >
          <TagIcon size={14} color={isSelected ? "icon-selected" : "icon"} />
          <Text
            data-test-id={`title`}
            variant={"body"}
            color={isSelected ? "paragraph-selected" : "paragraph"}
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
        <Text mt={1} variant="subBody">
          {currentContext?.length || totalNotes}
        </Text>
      }
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.deleteTags(
            useSelectionStore.getState().selectedItems
          );
        } else if (e.key === "Enter") {
          navigate(`/tags/${id}`);
        }
      }}
      menuItems={tagMenuItems}
      onClick={() => {
        navigate(`/tags/${id}`);
      }}
      onDragEnter={(e) => {
        e?.currentTarget.focus();
      }}
      onDrop={(e) => handleDrop(e.dataTransfer, item)}
    />
  );
}
export default Tag;

export const tagMenuItems: (tag: TagType, ids?: string[]) => MenuItem[] = (
  tag,
  ids = []
) => {
  const defaultTag = db.settings.getDefaultTag();
  return [
    {
      type: "button",
      key: "edit",
      title: strings.renameTag(),
      icon: Edit.path,
      onClick: () => EditTagDialog.show(tag)
    },
    {
      type: "button",
      key: "set-as-default",
      title: strings.setAsDefault(),
      isChecked: defaultTag === tag.id,
      icon: TagIcon.path,
      onClick: async () => {
        const defaultTag = db.settings.getDefaultTag();
        const isDefault = defaultTag === tag.id;
        if (!isDefault) {
          const result = await isFeatureAvailable("defaultNotebookAndTag");
          if (!result.isAllowed) return showFeatureNotAllowedToast(result);
        }
        await db.settings.setDefaultTag(isDefault ? undefined : tag.id);
      }
    },
    {
      type: "lazy-loader",
      key: "sidebar-items-loader",
      items: async () => [createSetDefaultHomepageMenuItem(tag.id, tag.type)]
    },
    {
      type: "button",
      key: "shortcut",
      title: db.shortcuts.exists(tag.id)
        ? strings.removeShortcut()
        : strings.addShortcut(),
      icon: Shortcut.path,
      onClick: () => appStore.addToShortcuts(tag)
    },
    { key: "sep", type: "separator" },
    {
      type: "button",
      key: "delete",
      variant: "dangerous",
      title: strings.delete(),
      icon: DeleteForver.path,
      onClick: async () => {
        await Multiselect.deleteTags(ids);
      },
      multiSelect: true
    }
  ];
};
