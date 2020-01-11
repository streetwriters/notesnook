import React from "react";
import { Text, Flex } from "rebass";
import { Sample } from "../utils/sample";

function TOS() {
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex flexDirection="column" flex="1 1 auto">
        <Text p="20px">{Sample.text}</Text>
      </Flex>
    </Flex>
  );
}

export default TOS;
