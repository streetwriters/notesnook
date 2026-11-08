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

import { strings } from "@notesnook/intl";
import type { TrashItem as TrashItemType } from "@notesnook/core";
import { Flex, Text, type MenuItem } from "@ui";
import ListItem from "../list-item";
import IconTag from "../icon-tag";
import TimeAgo from "../time-ago";
import { ClockCounterClockwise, Note, Notebook, Trash } from "../icons";
import { useEditorStore } from "../../stores/editor-store";
import { useStore as useSelectionStore } from "../../stores/selection-store";
import { Multiselect } from "../../common/multi-select";

type TrashItemProps = { item: TrashItemType; date: number; index?: number };
function TrashItem(props: TrashItemProps) {
  const { item, date } = props;
  const isOpened = useEditorStore((store) => store.isNoteOpen(item.id));
  const isSelected = useSelectionStore((store) =>
    store.selectedItems.includes(item.id)
  );

  return (
    <ListItem
      index={props.index}
      isFocused={isOpened}
      item={item}
      title={
        <Text
          testID="title"
          numberOfLines={1}
          sx={{
            color: "heading",
            minWidth: 0,
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
        gap: "spacing4"
      }}
      header={
        item.itemType === "note" || item.itemType === "notebook" ? (
          <Flex sx={{ flexDirection: "row", minWidth: 0 }}>
            <IconTag
              icon={item.itemType === "note" ? Note : Notebook}
              selected={isSelected || isOpened}
              text={
                item.itemType === "note"
                  ? strings.note()
                  : strings.dataTypesCamelCase.notebook()
              }
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
            alignItems: "center"
          }}
        >
          <Trash color="icon-disabled" size={12} />
          <TimeAgo
            live={true}
            datetime={date}
            sx={{ fontSize: "3xs", color: "paragraph-disabled" }}
          />
        </Flex>
      }
      menuItems={trashMenuItems}
      onPress={async () => {
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
) => MenuItem[] = (_item, ids = []) => {
  return [
    {
      type: "button",
      key: "restore",
      title: strings.restore(),
      iconComponent: ClockCounterClockwise,
      onClick: () => Multiselect.restoreItemsFromTrash(ids),
      multiSelect: true
    },
    {
      type: "button",
      key: "delete",
      title: strings.delete(),
      iconComponent: Trash,
      variant: "dangerous",
      onClick: () => Multiselect.deleteItemsFromTrash(ids),
      multiSelect: true
    }
  ];
};
