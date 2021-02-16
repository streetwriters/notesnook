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
      description={props.subtitle}
      icon={props.icon}
      positiveButton={{
        text: "Create topic",
        onClick: () => {
          props.onAction(ref.current.value);
        },
      }}
      onClose={props.onClose}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      <Box my={1}>
        <Input
          data-test-id="dialog-edit-topic"
          autoFocus
          ref={ref}
          placeholder="Topic title"
          defaultValue={props.topic && props.topic.title}
        ></Input>
      </Box>
    </Dialog>
  );
}

export function showTopicDialog() {
  return showDialog((perform) => (
    <TopicDialog
      title={"Create a Topic"}
      subtitle={"You can create as many topics as you want."}
      icon={Icon.Topic}
      onClose={() => {
        perform(false);
      }}
      onAction={async (topic) => {
        if (!topic) return;
        const notebookId = store.get().selectedNotebookId;
        await db.notebooks.notebook(notebookId).topics.add(topic);
        store.setSelectedNotebook(notebookId);
        perform(true);
      }}
    />
  ));
}

export function showEditTopicDialog(notebookId, topicId) {
  const topic = db.notebooks.notebook(notebookId)?.topics?.topic(topicId)
    ?._topic;
  if (!topic) return;
  return showDialog((perform) => (
    <TopicDialog
      title={"Edit Topic"}
      subtitle={`You are editing "${topic.title}" topic.`}
      icon={Icon.Topic}
      topic={topic}
      onClose={() => perform(false)}
      onAction={async (t) => {
        await db.notebooks
          .notebook(topic.notebookId)
          .topics.add({ ...topic, title: t });
        store.setSelectedNotebook(topic.notebookId);
        showToast("success", "Topic edited successfully!");
        perform(true);
      }}
    />
  ));
}
