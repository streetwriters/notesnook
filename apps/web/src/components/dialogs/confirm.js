import React from "react";
import { Box, Text } from "rebass";
import Dialog, { showDialog } from "./dialog";

function Confirm(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      content={
        <Box my={1}>
          <Text textAlign="center">{props.message}</Text>
        </Box>
      }
      positiveButton={{
        text: "Yes",
        onClick: props.onYes
      }}
      negativeButton={{ text: "No", onClick: props.onNo }}
    />
  );
}

export function confirm(icon, title, message) {
  return showDialog(perform => (
    <Confirm
      title={title}
      message={message}
      icon={icon}
      onNo={() => perform(false)}
      onYes={() => perform(true)}
    />
  ));
}
