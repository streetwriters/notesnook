import React, { useEffect } from "react";
import { Box, Text } from "rebass";
import Dialog from "./dialog";
import * as Icon from "../icons";

function LoadingDialog(props) {
  useEffect(() => {
    (async function () {
      try {
        props.onDone(await props.action());
      } catch (e) {
        props.onDone(e);
      }
    })();
  }, [props]);

  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      onClose={() => {}}
    >
      <Box>
        <Text as="span" variant="body">
          {props.message}
        </Text>
        <Icon.Loading rotate sx={{ my: 2 }} color="primary" />
      </Box>
    </Dialog>
  );
}
export default LoadingDialog;
