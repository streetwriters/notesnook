import React, { useEffect } from "react";
import * as Icon from "react-feather";
import { Flex, Text } from "rebass";
import ListItem from "../list-item";
import TimeAgo from "timeago-react";
import ListContainer from "../components/list-container";
import { confirm } from "../components/dialogs/confirm";
import { useStore, store } from "../stores/trash-store";
import { toTitleCase } from "../utils/string";

const dropdownRefs = [];
const menuItems = (item, index) => [
  {
    title: "Restore",
    onClick: () => store.getState().restore(item.id, index)
  },
  {
    title: "Delete",
    color: "red",
    onClick: () => {
      confirm(
        Icon.Trash2,
        "Delete",
        `Are you sure you want to permanently delete this item?`
      ).then(async res => {
        if (res) {
          await store.getState().delete(item.id, index);
        }
      });
    }
  }
];

const TrashItem = props => (index, item) => (
  <ListItem
    selectable
    item={item}
    title={item.title}
    body={item.headline}
    index={index}
    info={
      <Flex justifyContent="center" alignItems="center">
        <TimeAgo datetime={item.dateDeleted || item.dateCreated} />
        <Text as="span" mx={1}>
          •
        </Text>
        <Text color="primary">{toTitleCase(item.type)}</Text>
      </Flex>
    }
    menuData={item}
    menuItems={menuItems(item, index)}
    dropdownRefs={dropdownRefs}
  />
);

function Trash() {
  useEffect(() => store.getState().refresh(), []);
  const items = useStore(store => store.trash);
  const clearTrash = useStore(store => store.clear);
  return (
    <ListContainer
      itemsLength={items.length}
      searchPlaceholder={"Search trash"}
      searchParams={{
        type: "trash",
        items: items,
        item: TrashItem()
      }}
      items={items}
      item={index => TrashItem()(index, items[index])}
      button={{
        content: "Clear Trash",
        icon: Icon.Trash2,
        onClick: function() {
          confirm(
            Icon.Trash2,
            "Clear",
            `This action is irreversible. Are you sure you want to proceed?s`
          ).then(async res => {
            if (res) {
              await clearTrash();
            }
          });
        }
      }}
    />
  );
}

export default Trash;
