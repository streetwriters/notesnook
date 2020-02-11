import React, { useState, useEffect } from "react";
import { Flex } from "rebass";
import { db, ev } from "../common";
import { showSnack } from "../components/snackbar";
import Notebook from "../components/notebook";
import { CreateNotebookDialog } from "../components/dialogs";
import ListContainer from "../components/list-container";

const Notebooks = props => {
  const [open, setOpen] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  useEffect(() => {
    function onRefresh() {
      console.log(db.notebooks.all);
      setNotebooks(db.notebooks.all);
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
                //notes: db.notebooks.notebook(notebook.dateCreated, topic.title)
                notes: db.notebooks
                  .notebook(notebook.id)
                  .topics.topic(topic.title)
              })
            }
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
          if (
            await db.notebooks.add({
              title,
              description,
              topics
            }) /*addNotebook({ title, description, topics }))*/
          ) {
            setNotebooks(db.notebooks.all /*db.getNotebooks()*/);
            setOpen(false);
          } else {
            showSnack("Please fill out the notebook title.");
          }

          console.log(db.notebooks.notebook());
        }}
        close={() => {
          setOpen(false);
        }}
      />
    </>
  );
};

const NotebooksContainer = props => {
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
