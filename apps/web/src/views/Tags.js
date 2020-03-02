import React, { useEffect } from "react";
import { Flex, Text } from "rebass";
import ListContainer from "../components/list-container";
import ListItem from "../components/list-item";
import { db } from "../common";
import { store } from "../stores/note-store";

const TagNode = ({ title }) => (
  <Text as="span" fontFamily={"body"} fontSize="title" fontWeight={"body"}>
    <Text as="span" color="primary">
      {"#"}
    </Text>
    {title}
  </Text>
);

const Tags = props => {
  const tags = db.tags.all;
  return (
    <ListContainer
      itemsLength={tags.length}
      item={index => {
        const { title, count } = tags[index];

        return (
          <ListItem
            index={index}
            title={<TagNode title={title} />}
            info={`${count} notes`}
            onClick={() => {
              store
                .getState()
                .setSelectedContext({ type: "tag", value: title });
              props.navigator.navigate("notes", {
                title: "#" + title,
                context: { tags: [title] }
              });
            }}
          />
        );
      }}
    />
  );
};

const TagsContainer = () => {
  useEffect(() => {
    const TagNavigator = require("../navigation/navigators/tagnavigator")
      .default;
    if (!TagNavigator.restore()) {
      TagNavigator.navigate("tags");
    }
  }, []);
  return (
    <Flex className="TagNavigator" flexDirection="column" flex="1 1 auto" />
  );
};

export { Tags, TagsContainer };
