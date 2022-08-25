import React from "react";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/tag-store";
import TagsPlaceholder from "../components/placeholders/tags-placeholder";
import useNavigate from "../hooks/use-navigate";

function Tags() {
  useNavigate("tags", () => store.refresh());
  const tags = useStore((store) => store.tags);
  const refresh = useStore((store) => store.refresh);
  return (
    <ListContainer
      type="tags"
      groupType="tags"
      refresh={refresh}
      items={tags}
      placeholder={TagsPlaceholder}
    />
  );
}

export default Tags;
