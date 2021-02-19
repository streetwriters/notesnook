import React from "react";
import { Button, Flex, Image, Text } from "rebass";
import { hashNavigate } from "../../navigation";
import * as Icon from "../icons";

function EditorPlaceholder() {
  return (
    <Flex
      flexDirection="column"
      flex={1}
      justifyContent="center"
      alignItems="center"
    >
      <Image src="./logo.svg" width={150} />
      <Text variant="body" textAlign="center" mt={2}>
        Please create or open a note to start editing.
      </Text>
      <Button
        mt={2}
        display="flex"
        sx={{
          alignItems: "center",
          justifyContent: "center",
        }}
        variant="tool"
        onClick={() => hashNavigate("/notes/create")}
      >
        <Icon.Plus size={18} color="primary" />
        <Text ml={1}>Make a new note</Text>
      </Button>
    </Flex>
  );
}
export default EditorPlaceholder;
