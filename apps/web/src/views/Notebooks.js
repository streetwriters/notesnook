import React, { useState, useEffect } from "react";
import { Flex } from "rebass";
import { db, ev } from "../common";
import { showSnack } from "../components/snackbar";
import Notebook from "../components/notebook";
import { CreateNotebookDialog, ask } from "../components/dialogs";
import ListContainer from "../components/list-container";
import NotebookNavigator from "../navigation/navigators/nbnavigator";

const NotebooksView = props => {
  const [open, setOpen] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  useEffect(() => {
    function onRefresh() {
      setNotebooks(db.getNotebooks());
    }
    onRefresh();
    ev.addListener("refreshNotebooks", onRefresh);
    return () => {
      ev.removeListener("refreshNotebooks", onRefresh);
      Notebooks.onRefresh = undefined;
    };
  }, []);

  return (
    <>
      <ListContainer
        itemsLength={notebooks.length}
        item={index => (
          <Notebook
            index={index}
            item={notebooks[index]}
            onClick={() => {
              NotebookNavigator.navigate("topics", {
                title: notebooks[index].title,
                topics: notebooks[index].topics,
                notebookId: notebooks[index].dateCreated
              });
            }}
            /* onTopicClick={(notebook, topic) =>
                  navigate(topic, true, notebook.title)
                } */
          />
        )}
        button={{
          content: "Create a notebook",
          onClick: async () => setOpen(true)
        }}
      />
      <CreateNotebookDialog
        open={open}
        onDone={async (topics, title, description) => {
          if (await db.addNotebook({ title, description, topics })) {
            setNotebooks(db.getNotebooks());
            setOpen(false);
          } else {
            showSnack("Please fill out the notebook title.");
          }
        }}
        close={() => setOpen(false)}
      />
    </>
  );
};

const Notebooks = props => {
  useEffect(() => {
    NotebookNavigator.navigate("notebooks");
  }, []);
  return (
    <Flex
      className="NotebookNavigator"
      flexDirection="column"
      flex="1 1 auto"
    />
  );
};

export default Notebooks;
