import React from "react";
import ListItem from "../list-item";
import { navigate } from "../../navigation";
import { Text } from "rebass";
import { store as appStore } from "../../stores/app-store";
import { db } from "../../common/db";
import * as Icon from "../icons";

const menuItems = [
  {
    title: ({ tag }) =>
      db.settings.isPinned(tag.id) ? "Remove shortcut" : "Create shortcut",
    icon: Icon.Shortcut,
    onClick: ({ tag }) => appStore.pinItemToMenu(tag),
  },
];

function Tag({ item, index }) {
  const { id, title, noteIds } = item;
  return (
    <ListItem
      item={item}
      selectable={false}
      index={index}
      title={<TagNode title={title} />}
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
