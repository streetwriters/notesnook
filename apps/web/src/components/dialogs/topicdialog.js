import React, { useRef } from "react";
import { Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { db } from "../../common";
import Dialog, { showDialog } from "./dialog";
import { store } from "../../stores/notebook-store";
import { showToast } from "../../utils/toast";

function TopicDialog(props) {
  const ref = useRef();
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description="You can create as many topics as you want."
      icon={props.icon}
      positiveButton={{
        text: "Create topic",
        onClick: () => {
          props.onYes(ref.current.value);
        },
      }}
      negativeButton={{ text: "Cancel", onClick: props.onNo }}
    >
      <Box my={1}>
        <Input
          data-test-id="edit-topic-dialog"
          autoFocus
          ref={ref}
          placeholder="Topic title"
          defaultValue={props.topic && props.topic.title}
        ></Input>
      </Box>
    </Dialog>
  );
}

export function showTopicDialog(notebook) {
  return showDialog((perform) => (
    <TopicDialog
      title={"Create a Topic"}
      icon={Icon.Topic}
      onNo={() => {
        perform(false);
      }}
      onYes={async (topic) => {
        if (!topic) return;
        await db.notebooks.notebook(notebook).topics.add(topic);
        store.setSelectedNotebookTopics(notebook);
        perform(true);
      }}
    />
  ));
}

export function showEditTopicDialog(topic) {
  return showDialog((perform) => (
    <TopicDialog
      title={"Topic"}
      icon={Icon.Topic}
      topic={topic}
      onNo={() => {
        perform(false);
      }}
      onYes={async (t) => {
        await db.notebooks
          .notebook(topic.notebookId)
          .topics.add({ ...topic, title: t });
        store.setSelectedNotebookTopics(topic.notebookId);
        showToast("success", "Topic edited successfully!");
        perform(true);
      }}
    />
  ));
}
