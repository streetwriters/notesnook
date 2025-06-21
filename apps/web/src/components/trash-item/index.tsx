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
import { Restore, DeleteForver } from "../icons";
import { Flex, Text } from "@theme-ui/components";
import TimeAgo from "../time-ago";
import { toTitleCase } from "@notesnook/common";
import { MenuItem } from "@notesnook/ui";
import { TrashItem as TrashItemType } from "@notesnook/core";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { strings } from "@notesnook/intl";
import { Multiselect } from "../../common/multi-select";

type TrashItemProps = { item: TrashItemType; date: number };
function TrashItem(props: TrashItemProps) {
  const { item, date } = props;
  const isOpened = useEditorStore((store) => store.isNoteOpen(item.id));

  return (
    <ListItem
      isFocused={isOpened}
      item={item}
      title={item.title}
      body={item.itemType === "note" ? item.headline : item.description}
      onKeyPress={async (e) => {
        if (e.key === "Delete") {
          await Multiselect.deleteItemsFromTrash(
            useSelectionStore.getState().selectedItems
          );
        }
      }}
      footer={
        <Flex
          mt={1}
          sx={{ fontSize: "subBody", color: "var(--paragraph-secondary)" }}
        >
          <TimeAgo live={true} datetime={date} />
          <Text as="span" mx={1}>
            •
          </Text>
          <Text sx={{ color: "accent" }}>
            {toTitleCase(item.itemType as string)}
          </Text>
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
