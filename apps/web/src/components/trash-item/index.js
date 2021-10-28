import React from "react";
import ListItem from "../list-item";
import { confirm } from "../../common/dialog-controller";
import * as Icon from "../icons";
import { store } from "../../stores/trash-store";
import { Flex, Text } from "rebass";
import TimeAgo from "../time-ago";
import { toTitleCase } from "../../utils/string";
import { showToast } from "../../utils/toast";
import { showPermanentDeleteToast } from "../../common/toasts";

function TrashItem({ item, index }) {
  return (
    <ListItem
      selectable
      item={item}
      title={item.title}
      body={item.headline || item.description}
      index={index}
      footer={
        <Flex mt={1} sx={{ fontSize: "subBody", color: "fontTertiary" }}>
          <TimeAgo datetime={item.dateDeleted || item.dateCreated} />
          <Text as="span" mx={1}>
            •
          </Text>
          <Text color="primary">{toTitleCase(item.itemType)}</Text>
        </Flex>
      }
      menu={{ items: menuItems, extraData: { item } }}
    />
  );
}
export default TrashItem;

const menuItems = [
  {
    title: () => "Restore",
    icon: Icon.Restore,
    onClick: ({ item }) => {
      store.restore(item.id);
      showToast(
        "success",
        `${
          item.itemType === "note" ? "Note" : "Notebook"
        } restored successfully!`
      );
    },
  },
  {
    title: () => "Delete",
    icon: Icon.DeleteForver,
    color: "red",
    onClick: ({ item }) => {
      confirm({
        title: `Permanently Delete ${toTitleCase(item.itemType)}`,
        subtitle: `Are you sure you want to permanently delete this ${item.itemType}?`,
        yesText: `Delete ${item.itemType}`,
        noText: "Cancel",
        message: (
          <>
            This action is{" "}
            <Text as="span" color="error">
              IRREVERSIBLE
            </Text>
            . You will{" "}
            <Text as="span" color="primary">
              not be able to recover this {item.itemType}.
            </Text>
          </>
        ),
      }).then(async (res) => {
        if (res) {
          await store.delete(item.id);
          showPermanentDeleteToast(item);
        }
      });
    },
  },
];
