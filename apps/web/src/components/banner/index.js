import React from "react";
import { Flex, Text } from "rebass";

function Banner() {
  return (
    <Flex alignItems="center" justifyContent="center" bg="primary" py={1}>
      <Text color="static" textAlign="center" fontSize="title">
        Use our <a href="https://notesnook.com/mobile">mobile app</a> for a
        better experience.
      </Text>
    </Flex>
  );
}
export default Banner;
