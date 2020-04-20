import React, { useEffect } from "react";
import { Text } from "rebass";
import ListContainer from "../components/list-container";
import ListItem from "../components/list-item";
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
  const tags = useStore((store) => store.tags);
  useEffect(() => {
    store.refresh();
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
              props.navigator.navigate("notes", {
                title: "#" + title,
                context: { type: "tag", value: title },
              });
            }}
          />
        );
      }}
      placeholder={TagsPlaceholder}
    />
  );
}

export default Tags;
