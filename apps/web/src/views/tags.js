import React, { useEffect } from "react";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/tag-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";

function Tags() {
  const tags = useStore((store) => store.tags);
  useEffect(() => {
    store.refresh();
  }, []);

  return (
    <ListContainer type="tags" items={tags} placeholder={TagsPlaceholder} />
  );
}

export default Tags;
