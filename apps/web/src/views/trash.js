import React, { useEffect } from "react";
import * as Icon from "../components/icons";
import { Flex, Text } from "rebass";
import ListItem from "../components/list-item";
import TimeAgo from "timeago-react";
import ListContainer from "../components/list-container";
import { confirm } from "../components/dialogs/confirm";
import { useStore, store } from "../stores/trash-store";
import { toTitleCase } from "../utils/string";
import TrashPlaceholder from "../components/placeholders/trash-placeholder";
import { showToast } from "../utils/toast";
import { showPermanentDeleteToast } from "../common/toasts";
import {
  getNotebookHeight,
  getNoteHeight,
  MAX_HEIGHTS,
} from "../common/height-calculator";

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

function Trash() {
  useEffect(() => store.refresh(), []);
  const items = useStore((store) => store.trash);
  const clearTrash = useStore((store) => store.clear);
  return (
    <ListContainer
      type="trash"
      placeholder={TrashPlaceholder}
      estimatedItemHeight={Math.max(MAX_HEIGHTS.note, MAX_HEIGHTS.notebook)}
      itemHeight={(item) => {
        if (item.type === "note") return getNoteHeight(item);
        else if (item.type === "notebook") return getNotebookHeight(item);
      }}
      items={items}
      item={(index, item) => (
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
      )}
      button={{
        content: "Clear Trash",
        icon: Icon.Trash,
        onClick: function () {
          confirm(
            Icon.Trash,
            "Clear",
            `This action is irreversible. Are you sure you want to proceed?`
          ).then(async (res) => {
            if (res) {
              try {
                await clearTrash();
                showToast("success", "Trash cleared successfully!");
              } catch (e) {
                showToast(
                  "error",
                  `Could not clear trash. Error: ${e.message}`
                );
              }
            }
          });
        },
      }}
    />
  );
}
export default Trash;
