import React from "react";
import ListItem from "../list-item";
import { hashNavigate, navigate } from "../../navigation";
import { Text } from "rebass";
import { store as appStore } from "../../stores/app-store";
import { store as tagStore } from "../../stores/tag-store";
import { store as editorStore } from "../../stores/editor-store";
import { db } from "../../common/db";
import * as Icon from "../icons";
import { showToast } from "../../utils/toast";

const menuItems = [
  {
    key: "rename",
    title: "Rename tag",
    icon: Icon.Edit,
    onClick: ({ tag }) => {
      hashNavigate(`/tags/${tag.id}/edit`);
    },
  },
  {
    key: "shortcut",
    title: ({ tag }) =>
      db.settings.isPinned(tag.id) ? "Remove shortcut" : "Create shortcut",
    icon: Icon.Shortcut,
    onClick: ({ tag }) => appStore.pinItemToMenu(tag),
  },
  {
    key: "delete",
    color: "error",
    iconColor: "error",
    title: "Delete",
    icon: Icon.DeleteForver,
    onClick: async ({ items }) => {
      for (let tag of items) {
        if (tag.noteIds.includes(editorStore.get().session.id))
          await editorStore.clearSession();
        await db.tags.remove(tag.id);
      }
      showToast("success", `${items.length} tags deleted`);
      tagStore.refresh();
    },
    multiSelect: true,
  },
];

function Tag({ item, index }) {
  const { id, noteIds, alias } = item;
  return (
    <ListItem
      item={item}
      selectable={false}
      index={index}
      title={<TagNode title={alias} />}
      footer={
        <Text mt={1} variant="subBody">
          {noteIds.length} notes
        </Text>
      }
      menu={{ items: menuItems, extraData: { tag: item } }}
      onClick={() => {
        navigate(`/tags/${id}`);
      }}
    />
  );
}
export default Tag;

function TagNode({ title }) {
  return (
    <Text as="span" variant="title">
      <Text as="span" color="primary">
        {"#"}
      </Text>
      {title}
    </Text>
  );
}
