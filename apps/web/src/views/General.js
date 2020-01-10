import React from "react";
import { Flex, Button } from "rebass";

function General() {
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex flexDirection="column" flex="1 1 auto">
        <Button variant="setting">Reset to Factory Settings</Button>
        <Button variant="setting">Delete all Notes</Button>
        <Button variant="setting">Font Size</Button>
      </Flex>
    </Flex>
  );
}

export default General;
