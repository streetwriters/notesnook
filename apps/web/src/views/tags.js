import React, { useEffect } from "react";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/tag-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";
import Notes from "./notes";
import { useRoutes } from "hookrouter";
import RouteContainer from "../components/route-container";

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
    <ListContainer type="tags" items={tags} placeholder={TagsPlaceholder} />
  );
}

export default TagsContainer;
