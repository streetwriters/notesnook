import { useEffect, useState } from "react";
import { Box, Flex, Text } from "rebass";
import Dialog from "./dialog";

function ProgressDialog(props) {
  const [{ current, total, text }, setProgress] = useState({
    current: 0,
    total: 1,
    text: ""
  });

  useEffect(() => {
    (async function () {
      try {
        props.onDone(await props.action(setProgress));
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
        <Text variant="body">{text}</Text>
        {current > 0 ? (
          <>
            <Text variant="subBody">
              {current} of {total}
            </Text>
            <Box
              sx={{
                alignSelf: "start",
                my: 1,
                bg: "primary",
                height: "2px",
                width: `${(current / total) * 100}%`
              }}
            />
          </>
        ) : (
          <Flex my={1} />
        )}
      </Flex>
    </Dialog>
  );
}
export default ProgressDialog;
