import React, { useEffect } from "react";
import { Flex, Text } from "rebass";
import ListContainer from "../components/list-container";
import ListItem from "../components/list-item";
import { db } from "../common";
import { store } from "../stores/note-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";

const TagNode = ({ title }) => (
  <Text as="span" variant="title">
    <Text as="span" color="primary">
      {"#"}
    </Text>
    {title}
  </Text>
);
const TagItem = props => (index, item) => {
  const { title, count } = item;
  return (
    <ListItem
      item={item}
      selectable={false}
      index={index}
      title={<TagNode title={title} />}
      info={`${count} notes`}
      onClick={() => {
        store.getState().setSelectedContext({ type: "tag", value: title });
        props.navigator.navigate("notes", {
          title: "#" + title,
          context: { tags: [title] }
        });
      }}
    />
  );
};
const Tags = props => {
  const tags = db.tags.all;
  return (
    <ListContainer
      term={props.term}
      placeholder={TagsPlaceholder}
      itemsLength={tags.length}
      searchPlaceholder="Search tags"
      searchParams={{ type: "tags", items: tags, item: TagItem(props) }}
      item={index => TagItem(props)(index, tags[index])}
    />
  );
};

const TagsContainer = props => {
  useEffect(() => {
    const TagNavigator = require("../navigation/navigators/tagnavigator")
      .default;
    if (!TagNavigator.restore(props)) {
      TagNavigator.navigate("tags");
    }
  }, [props]);
  return (
    <Flex className="TagNavigator" flexDirection="column" flex="1 1 auto" />
  );
};

export { Tags, TagsContainer };
