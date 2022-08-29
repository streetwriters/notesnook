import React from "react";
import { Button, Flex, Text } from "@streetwriters/rebass";

const PlaceholderLoader = React.lazy(() => import("./loader"));
function Placeholder(props) {
  const { id, text, callToAction } = props;

  return (
    <>
      <Flex
        variant="columnCenter"
        alignSelf="stretch"
        sx={{ position: "relative" }}
      >
        <React.Suspense fallback={<div />}>
          <PlaceholderLoader name={id} width={"150px"} height={"150px"} />
        </React.Suspense>
        <Text
          variant="body"
          mt={2}
          color="fontTertiary"
          textAlign="center"
          mx={4}
        >
          {text}
        </Text>
        {callToAction && (
          <Button
            mt={1}
            display="flex"
            sx={{ alignItems: "center", justifyContent: "center" }}
            variant="tool"
            onClick={callToAction.onClick}
          >
            <callToAction.icon size={18} color="primary" />
            <Text ml={1}>{callToAction.text}</Text>
          </Button>
        )}
      </Flex>
    </>
  );
}
export default Placeholder;
