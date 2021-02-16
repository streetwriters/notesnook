import React from "react";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/tag-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";
import useNavigate from "../utils/use-navigate";

function Tags() {
  useNavigate("tags", () => store.refresh());
  const tags = useStore((store) => store.tags);
  return (
    <ListContainer type="tags" items={tags} placeholder={TagsPlaceholder} />
  );
}

export default Tags;
