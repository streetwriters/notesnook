import React, { useEffect } from "react";
import { Flex, Text } from "rebass";
import ListContainer from "../components/list-container";
import ListItem from "../components/list-item";
import { db } from "../common";
import { useStore } from "../stores/note-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";

const TagNode = ({ title }) => (
  <Text as="span" variant="title">
    <Text as="span" color="primary">
      {"#"}
    </Text>
    {title}
  </Text>
);

const Tags = props => {
  const setSelectedContext = useStore(store => store.setSelectedContext);
  const tags = db.tags.all;
  return (
    <ListContainer
      type="tags"
      items={tags}
      item={(index, item) => {
        const { title, count } = item;
        return (
          <ListItem
            item={item}
            selectable={false}
            index={index}
            title={<TagNode title={title} />}
            info={`${count} notes`}
            onClick={() => {
              setSelectedContext({ type: "tag", value: title });
              props.navigator.navigate("notes", {
                title: "#" + title,
                context: { tags: [title] }
              });
            }}
          />
        );
      }}
      placeholder={TagsPlaceholder}
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
