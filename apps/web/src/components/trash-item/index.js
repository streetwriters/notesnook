import React from "react";
import ListItem from "../list-item";
import { confirm } from "../dialogs/confirm";
import * as Icon from "../icons";
import { store } from "../../stores/notebook-store";
import { Flex, Text } from "rebass";
import TimeAgo from "timeago-react";
import { toTitleCase } from "../../utils/string";
import { showToast } from "../../utils/toast";
import { showPermanentDeleteToast } from "../../common/toasts";

function menuItems(item, index) {
  return [
    {
      title: "Restore",
      onClick: () => {
        store.restore(item.id, index);
        showToast(
          "success",
          `${item.type === "note" ? "Note" : "Notebook"} restored successfully!`
        );
      },
    },
    {
      title: "Delete",
      color: "red",
      onClick: () => {
        confirm(
          Icon.Trash,
          "Delete",
          `Are you sure you want to permanently delete this item?`
        ).then(async (res) => {
          if (res) {
            await store.delete(item.id, index);
            showPermanentDeleteToast(item, index);
          }
        });
      },
    },
  ];
}

function TrashItem({ item, index }) {
  return (
    <ListItem
      selectable
      item={item}
      title={item.title}
      body={item.headline || item.description}
      index={index}
      info={
        <Flex variant="rowCenter">
          <TimeAgo datetime={item.dateDeleted || item.dateCreated} />
          <Text as="span" mx={1}>
            •
          </Text>
          <Text color="primary">{toTitleCase(item.type)}</Text>
        </Flex>
      }
      menuData={item}
      menuItems={menuItems(item, index)}
    />
  );
}
export default TrashItem;
