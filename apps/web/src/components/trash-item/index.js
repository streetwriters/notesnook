import React from "react";
import ListItem from "../list-item";
import { showMultiPermanentDeleteConfirmation } from "../../common/dialog-controller";
import * as Icon from "../icons";
import { store } from "../../stores/trash-store";
import { Flex, Text } from "@streetwriters/rebass";
import TimeAgo from "../time-ago";
import { toTitleCase } from "../../utils/string";
import { showUndoableToast } from "../../common/toasts";
import { showToast } from "../../utils/toast";

function TrashItem({ item, index, date }) {
  return (
    <ListItem
      selectable
      item={item}
      title={item.title}
      body={item.headline || item.description}
      index={index}
      footer={
        <Flex mt={1} sx={{ fontSize: "subBody", color: "fontTertiary" }}>
          <TimeAgo live={true} datetime={date} />
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
    key: "restore",
    title: "Restore",
    icon: Icon.Restore,
    onClick: ({ items }) => {
      store.restore(items.map((i) => i.id));
      showToast("success", `${items.length} items restored`);
    },
    multiSelect: true
  },
  {
    key: "delete",
    title: "Delete",
    icon: Icon.DeleteForver,
    color: "error",
    iconColor: "error",
    onClick: async ({ items }) => {
      if (!(await showMultiPermanentDeleteConfirmation(items.length))) return;
      const ids = items.map((i) => i.id);
      showUndoableToast(
        `${items.length} items permanently deleted`,
        () => store.delete(ids),
        () => store.delete(ids, true),
        () => store.refresh()
      );
    },
    multiSelect: true
  }
];
