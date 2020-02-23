import React, { useState, useEffect } from "react";
import { Flex } from "rebass";
import { db } from "../common";
import Notebook from "../components/notebook";
import AddNotebookDialog from "../components/dialogs/addnotebookdialog";
import ListContainer from "../components/list-container";
import { useStore, store } from "../stores/notebook-store";

const Notebooks = props => {
  const [open, setOpen] = useState(false);
  useEffect(() => store.getState().init(), []);
  const notebooks = useStore(state => state.notebooks);
  const addNotebook = useStore(state => state.addNotebook);

  return (
    <>
      <ListContainer
        itemsLength={notebooks.length}
        item={index => (
          <Notebook
            index={index}
            item={notebooks[index]}
            onClick={() => {
              props.navigator.navigate("topics", {
                title: notebooks[index].title,
                topics: notebooks[index].topics,
                notebook: notebooks[index]
              });
            }}
            onTopicClick={(notebook, topic) =>
              props.navigator.navigate("notes", {
                title: notebook.title,
                subtitle: topic.title,
                notes: db.notebooks
                  .notebook(notebook.id)
                  .topics.topic(topic.title).all
              })
            }
          />
        )}
        button={{
          content: "Create a notebook",
          onClick: async () => setOpen(true)
        }}
      />
      <AddNotebookDialog
        isOpen={open}
        onDone={addNotebook}
        close={() => {
          setOpen(false);
        }}
      />
    </>
  );
};

const NotebooksContainer = () => {
  useEffect(() => {
    const NotebookNavigator = require("../navigation/navigators/nbnavigator")
      .default;
    if (!NotebookNavigator.restore()) {
      NotebookNavigator.navigate("notebooks");
    }
  }, []);
  return (
    <Flex
      className="NotebookNavigator"
      flexDirection="column"
      flex="1 1 auto"
    />
  );
};

export { NotebooksContainer, Notebooks };
