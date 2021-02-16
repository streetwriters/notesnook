import React from "react";
import ListItem from "../list-item";
import { confirm } from "../../common/dialog-controller";
import * as Icon from "../icons";
import { store } from "../../stores/trash-store";
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
          `${
            item.itemType === "note" ? "Note" : "Notebook"
          } restored successfully!`
        );
      },
    },
    {
      title: "Delete",
      color: "red",
      onClick: () => {
        confirm(Icon.Trash, {
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
          <Text color="primary">{toTitleCase(item.itemType)}</Text>
        </Flex>
      }
      menuItems={menuItems(item, index)}
    />
  );
}
export default TrashItem;
