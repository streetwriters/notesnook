import React, { useState } from "react";
import { Box } from "rebass";
import { Input } from "@rebass/forms";
import { db } from "../../common";
import Dialog, { showDialog } from "./dialog";
import { store } from "../../stores/notebook-store";

const TopicDialog = props => {
  const [topic, setTopic] = useState();
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      content={
        <Box my={1}>
          <Input
            variant="default"
            placeholder="name"
            onChange={e => {
              setTopic(e.target.value);
            }}
          ></Input>
        </Box>
      }
      positiveButton={{
        text: "Add",
        onClick: props.onYes.bind(this, topic)
      }}
      negativeButton={{ text: "Cancel", onClick: props.onNo }}
    />
  );
};

export const showTopicDialog = (icon, title, notebook) => {
  return showDialog(perform => (
    <TopicDialog
      title={title}
      icon={icon}
      onNo={() => {
        perform(false);
      }}
      onYes={async topic => {
        if (!topic) return;
        await db.notebooks.notebook(notebook).topics.add(topic);
        store.getState().setSelectedNotebookTopics(notebook);
        perform(true);
      }}
    />
  ));
};
