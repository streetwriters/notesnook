import React, { useEffect } from "react";
import { Text } from "rebass";
import ListContainer from "../components/list-container";
import ListItem from "../components/list-item";
import { useStore, store } from "../stores/tag-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";
import Notes from "./notes";
import { useRoutes, navigate } from "hookrouter";
import RouteContainer from "../components/route-container";

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

const routes = {
  "/": () => <RouteContainer title="Tags" route={<Tags />} />,
  "/:tag": ({ tag }) => (
    <RouteContainer
      type="notes"
      canGoBack
      title={`#${tag}`}
      route={<Notes type="notes" context={{ type: "tag", value: tag }} />}
    />
  ),
};

function TagsContainer() {
  const routeResult = useRoutes(routes);
  return routeResult;
}

function Tags() {
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
              navigate(`/tags/${title}`);
            }}
          />
        );
      }}
      placeholder={TagsPlaceholder}
    />
  );
}

export default TagsContainer;
