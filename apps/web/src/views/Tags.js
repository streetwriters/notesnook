import React, { useEffect } from "react";
import { Flex, Text } from "rebass";
import ListContainer from "../components/list-container";
import ListItem from "../components/list-item";
import { db } from "../common";

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
      item={index => (
        <ListItem
          isTag
          dropdownRefs={[]}
          menuItems={[]}
          index={index}
          title={<TagNode title={tags[index].title} />}
          onClick={() => {
            const notesOfTag = db.notes.tagged(tags[index].title);
            props.navigator.navigate("notes", {
              notes: notesOfTag,
              title: tags[index].title,
              context: { tags: [tags[index].title] }
            });
          }}
        />
      )}
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
