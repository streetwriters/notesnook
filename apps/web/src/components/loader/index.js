import { Flex, Text } from "rebass";
import { Loading } from "../icons";

export default function Loader({ title, text }) {
  return (
    <Flex
      flexDirection="column"
      flex={1}
      justifyContent="center"
      alignItems="center"
    >
      <Loading rotate />
      <Text variant="subtitle" mt={4}>
        {title}
      </Text>
      <Text variant="body" mt={2}>
        {text}
      </Text>
    </Flex>
  );
}
