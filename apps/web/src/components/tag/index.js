import React from "react";
import ListItem from "../list-item";
import { navigate } from "raviger";
import { Text } from "rebass";
import { store as appStore } from "../../stores/app-store";
import { db } from "../../common";

const menuItems = (item) => [
  {
    title: db.settings.isPinned(item.id) ? "Unpin from Menu" : "Pin to Menu",
    onClick: () => appStore.pinItemToMenu(item),
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
      info={`${noteIds.length} notes`}
      menuItems={menuItems(item)}
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
