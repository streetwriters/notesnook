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
import { Restore, DeleteForver, Note, Notebook, Trash } from "../icons";
import { Flex, Text } from "@theme-ui/components";
import TimeAgo from "../time-ago";
import { toTitleCase } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { TrashItem as TrashItemType } from "@notesnook/core";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { strings } from "@notesnook/intl";
import { Multiselect } from "../../common/multi-select";
import IconTag from "../icon-tag";

type TrashItemProps = { item: TrashItemType; date: number };
function TrashItem(props: TrashItemProps) {
  const { item, date } = props;
  const isOpened = useEditorStore((store) => store.isNoteOpen(item.id));
  const isSelected = useSelectionStore((store) =>
    store.selectedItems.includes(item.id)
  );

  return (
    <ListItem
      isFocused={isOpened}
      item={item}
      title={
        <Text
          dir="auto"
          data-test-id={`title`}
          sx={{
            color: "heading",
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: 600,
            fontSize: "sm"
          }}
        >
          {item.title}
        </Text>
      }
      body={item.itemType === "note" ? item.headline : item.description}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.deleteItemsFromTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      sx={{
        py: "spacing4",
        px: "spacing6",
        borderBottom: "1px solid",
        borderBottomColor: "border",
        gap: "spacing4",
        ":hover": {
          ".trash-chip": { backgroundColor: "background-tertiary" }
        }
      }}
      header={
        item.itemType === "note" ? (
          <Flex
            sx={{
              minWidth: 0
            }}
          >
            <IconTag
              className="trash-chip"
              icon={Note}
              selected={isSelected || isOpened}
              text={"Note"}
              iconSize={12}
              styles={{
                icon: { color: "icon-secondary" },
                text: { color: "paragraph" }
              }}
            />
          </Flex>
        ) : item.itemType === "notebook" ? (
          <Flex
            sx={{
              minWidth: 0
            }}
          >
            <IconTag
              className="trash-chip"
              icon={Notebook}
              selected={isSelected || isOpened}
              text={"Notebook"}
              iconSize={12}
              styles={{
                icon: { color: "icon-secondary" },
                text: { color: "paragraph" }
              }}
            />
          </Flex>
        ) : undefined
      }
      footer={
        <Flex
          sx={{
            gap: "spacing3",
            flexDirection: "row",
            fontSize: "xxs",
            color: "paragraph-disabled",
            alignItems: "center"
          }}
        >
          <Trash color="icon-disabled" size={12} />
          <TimeAgo live={true} datetime={date} />
        </Flex>
      }
      menuItems={trashMenuItems}
      onClick={async () => {
        if (item.itemType === "note")
          useEditorStore.getState().openSession(item);
      }}
    />
  );
}
export default TrashItem;

export const trashMenuItems: (
  item: TrashItemType,
  ids?: string[]
) => MenuItem[] = (item, ids = []) => {
  return [
    {
      type: "button",
      key: "restore",
      title: strings.restore(),
      icon: Restore.path,
      onClick: () => Multiselect.restoreItemsFromTrash(ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "delete",
      title: strings.delete(),
      icon: DeleteForver.path,
      variant: "dangerous",
      onClick: () => Multiselect.deleteItemsFromTrash(ids),
      multiSelect: true
    }
  ];
};
