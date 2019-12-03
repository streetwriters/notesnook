import React from "react";
import { Flex, Text } from "rebass";
import { ButtonPressedStyle } from "../../theme";

const Button = props => (
  <Flex
    bg="accent"
    width="full"
    py={3}
    px={3}
    flexDirection="row"
    alignItems="center"
    sx={{
      borderRadius: "default",
      marginBottom: 2,
      color: "fontSecondary",
      fontFamily: "body",
      fontWeight: "body",
      ...ButtonPressedStyle
    }}
    onClick={props.onClick}
  >
    {props.Icon && <props.Icon />}
    <Text className="unselectable" mx={1}>
      {props.content}
    </Text>
  </Flex>
);

export default Button;
