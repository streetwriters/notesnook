import React from "react";
import { Box, Text } from "rebass";
import Dialog from "./dialog";

function Confirm(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      scrollable
      description={props.subtitle}
      onClose={props.onNo}
      positiveButton={{
        text: props.yesText,
        onClick: props.onYes,
      }}
      negativeButton={
        props.noText && { text: props.noText, onClick: props.onNo }
      }
    >
      <Box>
        <Text as="span" variant="body">
          {props.message}
        </Text>
      </Box>
    </Dialog>
  );
}

export default Confirm;
