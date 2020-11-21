import React, { useMemo } from "react";
import { Flex, Text } from "rebass";
import { useTheme } from "emotion-theming";
import useMobile from "../../utils/use-mobile";
import useTablet from "../../utils/use-tablet";

//TODO use normal button
function Button(props) {
  const theme = useTheme();
  const isMobile = useMobile();
  const isTablet = useTablet();
  const boxShadow = useMemo(
    () => `1px 1px 10px 0px ${theme.colors["primary"]}`,
    [theme.colors]
  );
  return (
    <Flex
      data-test-id={props.testId}
      bg="primary"
      py={[3, 3, 2]}
      px={[3, 3, 2]}
      mx={2}
      alignItems="center"
      display={["flex", "flex", props.show ? "flex" : "none"]}
      sx={{
        position: ["absolute", "absolute", "relative"],
        bottom: [2, 2, 0],
        right: [2, 2, 0],
        borderRadius: [50, 50, "default"],
        marginBottom: 2,
        color: "static",
        fontFamily: "body",
        fontWeight: "body",
        boxShadow: [boxShadow, boxShadow, "none"],
        ":hover": {
          cursor: "pointer",
          bg: theme.colors.primary + "dd",
        },
      }}
      onClick={props.onClick}
    >
      {props.Icon && (
        <props.Icon color="static" size={isMobile || isTablet ? 24 : 20} />
      )}
      <Text
        display={["none", "none", "flex"]}
        as="span"
        mx={1}
        fontSize={"body"}
        flex="1 1 auto"
      >
        {props.content}
      </Text>
    </Flex>
  );
}
export default Button;
