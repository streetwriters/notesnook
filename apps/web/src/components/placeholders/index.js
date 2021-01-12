import React, { useEffect } from "react";
import { Button, Flex, Text } from "rebass";
import { useStore } from "../../stores/theme-store";
import { changeSvgTheme } from "../../utils/css";

function Placeholder(props) {
  const accent = useStore((store) => store.accent);
  useEffect(() => {
    changeSvgTheme(accent);
  }, [accent]);
  const { image: Image, title, text, callToAction } = props;

  return (
    <>
      <Flex
        variant="columnCenter"
        alignSelf="stretch"
        sx={{ position: "relative" }}
      >
        <Image width={"100%"} height={"100px"} />
        <Text variant="body" mt={2} color="fontTertiary">
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
