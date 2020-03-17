import React, { useEffect } from "react";
import * as Icon from "../components/icons";
import { Flex, Text } from "rebass";
import ListItem from "../components/list-item";
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
        Icon.Trash,
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

function Trash() {
  useEffect(() => store.getState().refresh(), []);
  const items = useStore(store => store.trash);
  const clearTrash = useStore(store => store.clear);
  return (
    <ListContainer
      type="trash"
      items={items}
      item={(index, item) => (
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
      )}
      button={{
        content: "Clear Trash",
        icon: Icon.Trash,
        onClick: function() {
          confirm(
            Icon.Trash,
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
