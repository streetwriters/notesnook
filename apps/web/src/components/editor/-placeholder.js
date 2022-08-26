import React from "react";
import Logo from "../../assets/logo.svg";
import LogoDark from "../../assets/logo-dark.svg";
import { Button, Flex, Image, Text } from "rebass";
import { hashNavigate } from "../../navigation";
import * as Icon from "../icons";
import { useStore as useThemeStore } from "../../stores/theme-store";

function EditorPlaceholder() {
  const theme = useThemeStore((store) => store.theme);
  return (
    <Flex
      flexDirection="column"
      flex={1}
      justifyContent="center"
      alignItems="center"
    >
      <Image src={theme === "dark" ? LogoDark : Logo} width={150} />
      <Text variant="body" textAlign="center" mt={2}>
        Please create or open a note to start editing.
      </Text>
      <Button
        mt={2}
        display="flex"
        sx={{
          alignItems: "center",
          justifyContent: "center"
        }}
        variant="tool"
        onClick={() =>
          hashNavigate("/notes/create", { addNonce: true, replace: true })
        }
      >
        <Icon.Plus size={18} color="primary" />
        <Text ml={1}>Make a new note</Text>
      </Button>
    </Flex>
  );
}
export default EditorPlaceholder;
