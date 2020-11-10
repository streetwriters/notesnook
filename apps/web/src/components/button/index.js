import React from "react";
import { Flex } from "rebass";
import { useTheme } from "emotion-theming";

//TODO use normal button
function Button(props) {
  const theme = useTheme();
  return (
    <Flex
      data-test-id={props.testId}
      bg="primary"
      py={2}
      px={2}
      mx={2}
      alignItems="center"
      display={["flex", "none", "none"]}
      sx={{
        position: "absolute",
        bottom: 2,
        right: 2,
        borderRadius: 50,
        marginBottom: 2,
        color: "static",
        fontFamily: "body",
        fontWeight: "body",
        boxShadow: `1px 1px 10px 0px ${theme.colors["primary"]}`,
        ":hover": {
          cursor: "pointer",
          bg: theme.colors.primary + "dd",
        },
      }}
      onClick={props.onClick}
    >
      {props.Icon && <props.Icon color="static" />}
      {/* <Text as="span" mx={1} fontSize={"body"} flex="1 1 auto">
        {props.content}
      </Text> */}
    </Flex>
  );
}
export default Button;
