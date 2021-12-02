import { Flex, Text } from "rebass";
import * as Icon from "../icons";

function EditorLoading({ text }) {
  return (
    <Flex
      flexDirection="column"
      flex={1}
      justifyContent="center"
      alignItems="center"
    >
      <Icon.Loading color="primary" sx={{ mt: 2 }} />
      <Text variant="body" textAlign="center" mt={2}>
        {text || "Loading editor. Please wait..."}
      </Text>
    </Flex>
  );
}
export default EditorLoading;
