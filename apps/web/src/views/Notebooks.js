import React, { useState, useEffect } from "react";
import { Flex, Text } from "rebass";
import Button from "../components/button";
import * as Icon from "react-feather";
import Search from "../components/search";
import { db, ev } from "../common";
import { showSnack } from "../components/snackbar";
import { Virtuoso as List } from "react-virtuoso";
import Notebook from "../components/notebook";
import Topic from "../components/topic";
import Note from "../components/note";
import { sendNewNoteEvent } from "../common";
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
                  notebook: notebooks[index]
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

const TopicsView = props => {
  let notebook = props.notebook;
  useEffect(() => {
    props.canGoBack(true);
    props.backAction(() => {
      props.canGoBack(false);
      NotebookNavigator.goBack();
    });
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
          totalCount={notebook.topics.length}
          item={index => (
            <Topic
              index={index}
              item={notebook.topics[index]}
              onClick={() => {
                let topic = notebook.topics[index];
                NotebookNavigator.navigate("notes", {
                  title: topic.title,
                  topic
                });
              }}
            />
          )}
        />
        <Button Icon={Icon.Plus} content={"Add more topics"} />
      </Flex>
    </Flex>
  );
};

const Notes = props => {
  let topic = props.topic;
  useEffect(() => {
    props.canGoBack(true);
    props.backAction(() => {
      props.canGoBack(false);
      NotebookNavigator.goBack();
    });
  }, []);
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Search placeholder="Search" />
      <List
        style={{
          width: "100%",
          flex: "1 1 auto",
          height: "auto",
          overflowX: "hidden"
        }}
        totalCount={topic.notes.length}
        item={index => <Note index={index} item={topic.notes[index]} />}
      />
      <Button
        Icon={Icon.Plus}
        content="Make a new note"
        onClick={sendNewNoteEvent}
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
  ...createRoute("topics", TopicsView),
  ...createRoute("notes", Notes)
};
const NotebookNavigator = new Navigator("NotebookNavigator", routes);
