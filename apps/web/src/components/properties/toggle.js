import React from "react";
import { Flex, Text } from "rebass";
import { useStore } from "../../stores/editor-store";

function Toggle(props) {
  const { icons, label, onToggle, toggleKey } = props;
  const isOn = useStore((store) => store.session[toggleKey]);
  return (
    <Flex
      variant="columnCenter"
      width="33%"
      py={2}
      mr={1}
      sx={{ borderRadius: "default", cursor: "pointer" }}
      onClick={() => onToggle(!isOn)}
      data-test-id={props.testId}
    >
      {isOn ? <icons.on color="primary" /> : <icons.off />}
      <Text mt={1} variant="body" color={isOn ? "primary" : "text"}>
        {label}
      </Text>
    </Flex>
  );
}
export default Toggle;
