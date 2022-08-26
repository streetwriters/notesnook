import React from "react";
import { Flex, Text } from "rebass";
import ListItem from "../list-item";
import { useStore, store } from "../../stores/notebook-store";
import { store as appStore } from "../../stores/app-store";
import { showItemDeletedToast, showUnpinnedToast } from "../../common/toasts";
import { db } from "../../common/db";
import * as Icon from "../icons";
import { hashNavigate, navigate } from "../../navigation";
import IconTag from "../icon-tag";
import { showToast } from "../../utils/toast";
import { Multiselect } from "../../common/multi-select";
import { pluralize } from "../../utils/string";

function Notebook(props) {
  const { item, index, totalNotes, date } = props;
  const notebook = item;
  const isCompact = useStore((store) => store.viewMode === "compact");

  return (
    <ListItem
      selectable
      isCompact={isCompact}
      item={notebook}
      onClick={() => {
        navigate(`/notebooks/${notebook.id}`);
      }}
      title={notebook.title}
      body={notebook.description}
      index={index}
      menu={{ items: menuItems, extraData: { notebook } }}
      footer={
        isCompact ? (
          <>
            <Text fontSize="subBody" color="fontTertiary">
              {pluralize(totalNotes, "note", "notes")}
            </Text>
          </>
        ) : (
          <>
            {notebook?.topics && (
              <Flex mb={1}>
                {notebook?.topics.slice(0, 3).map((topic) => (
                  <IconTag
                    key={topic.id}
                    text={topic.title}
                    icon={Icon.Topic}
                    onClick={(e) => {
                      navigate(`/notebooks/${notebook.id}/${topic.id}`);
                    }}
                  />
                ))}
              </Flex>
            )}
            <Flex
              sx={{ fontSize: "subBody", color: "fontTertiary" }}
              alignItems="center"
            >
              {notebook.pinned && (
                <Icon.PinFilled color="primary" size={13} sx={{ mr: 1 }} />
              )}
              <Text variant="subBody" color="primary">
                Notebook
              </Text>
              <Text as="span" mx={1}>
                •
              </Text>
              {new Date(date).toLocaleDateString("en", {
                dateStyle: "medium"
              })}
              <Text as="span" mx={1}>
                •
              </Text>
              <Text>{pluralize(totalNotes, "note", "notes")}</Text>
            </Flex>
          </>
        )
      }
    />
  );
}
export default React.memo(Notebook, (prev, next) => {
  const prevItem = prev.item;
  const nextItem = next.item;

  return (
    prev.date === next.date &&
    prevItem.pinned === nextItem.pinned &&
    prevItem.title === nextItem.title &&
    prevItem.description === nextItem.description &&
    prevItem.topics.length === nextItem.topics.length &&
    prev.totalNotes === next.totalNotes
  );
});

const pin = (notebook) => {
  return store
    .pin(notebook.id)
    .then(() => {
      if (notebook.pinned) showUnpinnedToast(notebook.id, "notebook");
    })
    .catch((error) => showToast("error", error.message));
};

const menuItems = [
  {
    key: "edit",
    title: "Edit",
    icon: Icon.NotebookEdit,
    onClick: ({ notebook }) => hashNavigate(`/notebooks/${notebook.id}/edit`)
  },
  {
    key: "pin",
    icon: Icon.Pin,
    title: ({ notebook }) => (notebook.pinned ? "Unpin" : "Pin"),
    onClick: ({ notebook }) => pin(notebook)
  },
  {
    key: "shortcut",
    icon: Icon.Shortcut,
    title: ({ notebook }) =>
      db.settings.isPinned(notebook.id) ? "Remove shortcut" : "Create shortcut",
    onClick: ({ notebook }) => appStore.pinItemToMenu(notebook)
  },
  {
    key: "movetotrash",
    title: "Move to trash",
    color: "error",
    iconColor: "error",
    icon: Icon.Trash,
    onClick: async ({ items }) => {
      await Multiselect.moveNotebooksToTrash(items);
    },
    multiSelect: true
  }
];
