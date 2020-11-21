import React, { useEffect } from "react";
import * as Icon from "../components/icons";
import ListContainer from "../components/list-container";
import { confirm } from "../components/dialogs/confirm";
import { useStore, store } from "../stores/trash-store";
import TrashPlaceholder from "../components/placeholders/trash-placeholder";
import { showToast } from "../utils/toast";
import { Text } from "rebass";

function Trash() {
  useEffect(() => store.refresh(), []);
  const items = useStore((store) => store.trash);
  const clearTrash = useStore((store) => store.clear);
  console.log(items);
  return (
    <ListContainer
      type="trash"
      placeholder={TrashPlaceholder}
      items={items}
      button={{
        show: true,
        content: "Clear Trash",
        icon: Icon.Trash,
        onClick: function () {
          confirm(Icon.Trash, {
            title: "Clear Trash",
            subtitle: "Are you sure you want to clear all the trash?",
            yesText: "Clear trash",
            noText: "Cancel",
            message: (
              <>
                This action is{" "}
                <Text as="span" color="error">
                  IRREVERSIBLE
                </Text>
                . You will{" "}
                <Text as="span" color="primary">
                  not be able to recover any of these items.
                </Text>
              </>
            ),
          }).then(async (res) => {
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
