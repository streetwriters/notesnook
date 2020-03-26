import React, { useEffect } from "react";
import { Flex, Text } from "rebass";
import ListContainer from "../components/list-container";
import ListItem from "../components/list-item";
import { useStore as useNotesStore } from "../stores/note-store";
import { useStore, store } from "../stores/tag-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";

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

function Tags(props) {
  const setSelectedContext = useNotesStore(store => store.setSelectedContext);
  const tags = useStore(store => store.tags);
  useEffect(() => {
    store.getState().refreshTags();
  }, []);
  return (
    <ListContainer
      type="tags"
      items={tags}
      item={(index, item) => {
        const { title, noteIds } = item;
        return (
          <ListItem
            item={item}
            selectable={false}
            index={index}
            title={<TagNode title={title} />}
            info={`${noteIds.length} notes`}
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
}

function TagsContainer() {
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
}

export { Tags, TagsContainer };
