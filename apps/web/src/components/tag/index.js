import React from "react";
import ListItem from "../list-item";
import { navigate } from "hookrouter";
import { Text } from "rebass";

function Tag({ item, index }) {
  const { title, noteIds } = item;
  return (
    <ListItem
      item={item}
      selectable={false}
      index={index}
      title={<TagNode title={title} />}
      info={`${noteIds.length} notes`}
      onClick={() => {
        navigate(`/tags/${title}`);
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
