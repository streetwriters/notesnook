import React, { useState } from "react";
import { Box } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import { db } from "../../common";
import Dialog, { showDialog } from "./dialog";
import { store } from "../../stores/notebook-store";

function TopicDialog(props) {
  const [topic, setTopic] = useState();
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      positiveButton={{
        text: "Add",
        onClick: props.onYes.bind(this, topic),
      }}
      negativeButton={{ text: "Cancel", onClick: props.onNo }}
    >
      <Box my={1}>
        <Input
          placeholder="Topic title"
          onChange={(e) => {
            setTopic(e.target.value);
          }}
        ></Input>
      </Box>
    </Dialog>
  );
}

export function showTopicDialog(notebook) {
  return showDialog((perform) => (
    <TopicDialog
      title={"Topic"}
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
