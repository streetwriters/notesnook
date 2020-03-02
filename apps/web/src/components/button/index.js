import React from "react";
import { Flex, Text } from "rebass";
import { ButtonPressedStyle } from "../../utils/theme";
import { useTheme } from "emotion-theming";

const Button = props => {
  const theme = useTheme();
  return (
    <Flex
      bg="primary"
      width={props.width}
      py={3}
      px={3}
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
          bg: theme.colors.primary + "dd"
        },
        ...ButtonPressedStyle,
        ...props.style
      }}
      onClick={props.onClick}
    >
      {props.Icon && <props.Icon />}
      <Text as="span" mx={1} fontSize={"body"} flex="1 1 auto">
        {props.content}
      </Text>
    </Flex>
  );
};
export default Button;
