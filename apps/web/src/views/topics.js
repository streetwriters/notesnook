import React, { useState, useEffect } from "react";
import Topic from "../components/topic";
import { Flex } from "rebass";
import ListContainer from "../components/list-container";
import { useStore as useNbStore } from "../stores/notebook-store";
import { showTopicDialog } from "../components/dialogs/topicdialog";
import { navigate } from "hookrouter";
import { getItemHeight, MAX_HEIGHTS } from "../common/height-calculator";

function Topics(props) {
  const { notebookId } = props;

  const setSelectedNotebookTopics = useNbStore(
    (store) => store.setSelectedNotebookTopics
  );
  const selectedNotebookTopics = useNbStore(
    (store) => store.selectedNotebookTopics
  );

  const [topics, setTopics] = useState([]);
  useEffect(() => {
    setTopics(selectedNotebookTopics);
  }, [selectedNotebookTopics]);

  useEffect(() => {
    setSelectedNotebookTopics(notebookId);
  }, [setSelectedNotebookTopics, notebookId]);

  return (
    <>
      <ListContainer
        type="topics"
        items={topics}
        itemHeight={getItemHeight}
        estimatedItemHeight={MAX_HEIGHTS.generic}
        item={(index, item) => (
          <Topic
            index={index}
            item={item}
            onClick={() => navigate(`/notebooks/${notebookId}/${item.id}`)}
          />
        )}
        placeholder={Flex}
        button={{
          content: "Add more topics",
          onClick: async () => {
            await showTopicDialog(notebookId);
          },
        }}
      />
    </>
  );
}
export default Topics;
