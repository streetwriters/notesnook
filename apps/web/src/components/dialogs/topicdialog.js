import React, { useRef } from "react";
import { Box } from "rebass";
import { Input } from "@rebass/forms";
import Dialog from "./dialog";

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

export default TopicDialog;
