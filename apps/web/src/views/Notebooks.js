import React, { useState, useEffect } from "react";
import { Flex, Text } from "rebass";
import Button from "../components/button";
import * as Icon from "react-feather";
import Search from "../components/search";
import { db, ev } from "../common";
import { showSnack } from "../components/snackbar";
import { Virtuoso as List } from "react-virtuoso";
import Notebook from "../components/notebook";
import Topics from "./Topics";
import Notes from "./Notes";
import { createRoute } from "../navigation/routes";
import Navigator from "../navigation";
import { CreateNotebookDialog, ask } from "../components/dialogs";

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
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex flexDirection="column" flex="1 1 auto">
        <Search placeholder="Search" />
        <List
          style={{
            width: "100%",
            flex: "1 1 auto",
            height: "auto",
            overflowX: "hidden"
          }}
          totalCount={notebooks.length}
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
        />
        <Button
          Icon={Icon.Plus}
          onClick={async () => setOpen(true)}
          content="Create a notebook"
        />
      </Flex>
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
    </Flex>
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

const routes = {
  ...createRoute("notebooks", NotebooksView, { title: "Notebooks" }),
  ...createRoute("topics", Topics),
  ...createRoute("notes", Notes)
};
const NotebookNavigator = new Navigator("NotebookNavigator", routes, {
  backButtonEnabled: true
});
export { NotebookNavigator };
