import React from "react";
import { Flex, Text } from "rebass";
import { useTheme } from "emotion-theming";

//TODO use normal button
function Button(props) {
  const theme = useTheme();
  return (
    <Flex
      bg="primary"
      width={props.width}
      py={2}
      px={2}
      mx={2}
      flexDirection="row"
      alignItems="center"
      sx={{
        borderRadius: "default",
        marginBottom: 2,
        color: "static",
        fontFamily: "body",
        fontWeight: "body",
        ":hover": {
          cursor: "pointer",
          bg: theme.colors.primary + "dd",
        },
        ...props.style,
      }}
      onClick={props.onClick}
    >
      {props.Icon && <props.Icon color="static" />}
      <Text as="span" mx={1} fontSize={"body"} flex="1 1 auto">
        {props.content}
      </Text>
    </Flex>
  );
}
export default Button;
