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
    title: () => "Rename tag",
    icon: Icon.Edit,
    onClick: ({ tag }) => {
      hashNavigate(`/tags/${tag.id}/edit`);
    },
  },
  {
    title: ({ tag }) =>
      db.settings.isPinned(tag.id) ? "Remove shortcut" : "Create shortcut",
    icon: Icon.Shortcut,
    onClick: ({ tag }) => appStore.pinItemToMenu(tag),
  },
  {
    color: "error",
    title: () => "Delete",
    icon: Icon.DeleteForver,
    onClick: async ({ tag }) => {
      if (tag.noteIds.includes(editorStore.get().session.id))
        editorStore.clearSession();

      await db.tags.remove(tag.id);
      showToast("success", "Tag deleted!");
      tagStore.refresh();
    },
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
