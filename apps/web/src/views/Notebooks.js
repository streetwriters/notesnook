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
import { routes, navigationEvents, goBack as p_goBack } from "../navigation";
import { CreateNotebookDialog, ask } from "../components/dialogs";

const history = [{}];
const Notebooks = props => {
  const [open, setOpen] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const [selected, setSelected] = useState({});
  const [intent, setIntent] = useState(props.intent);
  useEffect(() => {
    function onRefresh() {
      setNotebooks(db.getNotebooks());
    }
    onRefresh();
    navigationEvents.onWillNavigateAway = async routeName => {
      if (intent === "moveNote") {
        return await ask(
          Icon.Move,
          "Move",
          "Are you sure you want to navigate away? Your note selection will be lost."
        );
      }
      return true;
    };
    ev.addListener("refreshNotebooks", onRefresh);
    return () => {
      ev.removeListener("refreshNotebooks", onRefresh);
      navigationEvents.onWillNavigateAway = undefined;
      Notebooks.onRefresh = undefined;
    };
  }, [intent]);
  function navigate(item, save = true, title = undefined) {
    //transform notes in a topic to real notes
    if (item.notes) {
      item = { ...item };
      item.notes = db.getTopic(selected.dateCreated, item.title);
    }
    if (save) {
      history[history.length] = selected;
    }
    //set notebook title if we are inside the notebook else set the provided or item's title.
    title =
      selected.type === "notebook"
        ? selected.title
        : title || item.title || routes.notebooks.title;
    props.changeTitle(title);
    props.canGoBack(item.title !== undefined);
    props.backAction(goBack);

    setSelected((item.title && item) || {});
  }
  function goBack() {
    navigate(history.pop(), false);
  }
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      {notebooks.length > 0 ? (
        <Flex flexDirection="column" flex="1 1 auto">
          {selected.type === "topic" && (
            <Text variant="title" color="primary">
              {selected.title}
            </Text>
          )}
          {intent === "moveNote" && selected.type !== "topic" && (
            <Text variant="body" color="primary" fontWeight="bold">
              Please select a{" "}
              {selected.type === "notebook" ? "topic" : "notebook"} to move the
              note to:
            </Text>
          )}
          <Search placeholder="Search" />
          <List
            style={{
              width: "100%",
              flex: "1 1 auto",
              height: "auto",
              overflowX: "hidden"
            }}
            totalCount={
              selected.type === "notebook"
                ? selected.topics.length
                : selected.type === "topic"
                ? selected.notes.length
                : notebooks.length
            }
            item={index => {
              return selected.type === "notebook" ? (
                <Topic
                  index={index}
                  item={selected.topics[index]}
                  onClick={() => navigate(selected.topics[index])}
                />
              ) : selected.type === "topic" ? (
                <Note index={index} item={selected.notes[index]} />
              ) : (
                <Notebook
                  index={index}
                  item={notebooks[index]}
                  onClick={() => navigate(notebooks[index])}
                  onTopicClick={(notebook, topic) =>
                    navigate(topic, true, notebook.title)
                  }
                />
              );
            }}
          />
          <Button
            Icon={
              intent === "moveNote" && selected.type === "topic"
                ? Icon.Move
                : Icon.Plus
            }
            onClick={async () => {
              if (intent === "moveNote" && selected.type === "topic") {
                let to = {
                  notebook: history[history.length - 1].dateCreated,
                  topic: selected.title
                };
                db.moveNote(props.data.dateCreated, props.data.notebook, to)
                  .then(
                    result =>
                      result &&
                      showSnack(
                        `Moved note to ${history[history.length - 1].title}.`
                      )
                  )
                  .catch(err => showSnack(err.message));
                p_goBack();
                setIntent(undefined);
              } else {
                setOpen(true);
              }
            }}
            content={
              selected.type === "notebook"
                ? "Add more topics"
                : selected.type === "topic"
                ? intent === "moveNote"
                  ? "Move note here"
                  : "Make a new note"
                : "Create a notebook"
            }
          />
        </Flex>
      ) : (
        <Flex
          flex="1 1 auto"
          alignItems="center"
          justifyContent="center"
          color="#9b9b9b"
          flexDirection="column"
        >
          <Icon.Book size={72} strokeWidth={1.5} />
          <Text variant="title">You have no notebooks</Text>
          <Button
            Icon={Icon.Plus}
            content="Let's create one"
            onClick={() => setOpen(true)}
            style={{ marginTop: 2, textAlign: "center" }}
            width={"auto"}
          />
        </Flex>
      )}
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

export default Notebooks;
