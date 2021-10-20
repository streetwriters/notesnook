import { useEffect, useState } from "react";
import { Box, Flex, Text } from "rebass";
import Dialog from "./dialog";

function ProgressDialog(props) {
  const [{ loaded, progress }, setProgress] = useState({
    loaded: 0,
    progress: 0,
  });

  useEffect(() => {
    if (!props.setProgress) return;
    const undo = props.setProgress(setProgress);
    return () => {
      undo && undo();
    };
  }, [props, setProgress]);

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
      <Flex flexDirection="column">
        <Text variant="body">{props.message}</Text>
        <Text variant="subBody">
          {loaded} of {props.total}
        </Text>
        <Box
          sx={{
            alignSelf: "start",
            my: 1,
            bg: "primary",
            height: "2px",
            width: `${progress}%`,
          }}
        />
      </Flex>
    </Dialog>
  );
}
export default ProgressDialog;
