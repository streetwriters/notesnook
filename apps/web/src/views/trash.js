import React, { useEffect } from "react";
import * as Icon from "../components/icons";
import ListContainer from "../components/list-container";
import { confirm } from "../components/dialogs/confirm";
import { useStore, store } from "../stores/trash-store";
import TrashPlaceholder from "../components/placeholders/trash-placeholder";
import { showToast } from "../utils/toast";

function Trash() {
  useEffect(() => store.refresh(), []);
  const items = useStore((store) => store.trash);
  const clearTrash = useStore((store) => store.clear);
  return (
    <ListContainer
      type="trash"
      placeholder={TrashPlaceholder}
      items={items}
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
