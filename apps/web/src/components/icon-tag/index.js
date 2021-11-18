import { Flex, Text } from "rebass";

function IconTag({ text, title, icon: Icon, onClick, styles, testId }) {
  return (
    <Flex
      data-test-id={testId}
      flexShrink={0}
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      title={text || title}
      sx={{
        borderRadius: "default",
        border: "1px solid",
        borderColor: "border",
        lineHeight: "initial",
        ":hover": {
          bg: "hover",
          filter: "brightness(95%)",
        },
        maxWidth: 150,
        px: 1,
        mr: 1,
        cursor: onClick ? "pointer" : "default",
        overflow: "hidden",
        ...styles?.container,
      }}
      bg="bgSecondary"
      justifyContent="center"
      alignItems="center"
      py="2px"
    >
      <Icon
        size={11}
        color={styles?.icon?.color}
        sx={{ ...styles?.icon, flexShrink: 0 }}
      />
      <Text
        variant="body"
        sx={{
          fontSize: 11,
          ml: "2px",
          p: 0,
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          overflow: "hidden",
          ...styles?.text,
        }}
      >
        {text}
      </Text>
    </Flex>
  );
}
export default IconTag;
