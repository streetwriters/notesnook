import { Flex, Text } from "rebass";

function IconTag({ text, icon: Icon, onClick, styles }) {
  return (
    <Flex
      onClick={(e) => {
        if (onClick) {
          e.stopPropagation();
          onClick(e);
        }
      }}
      sx={{
        borderRadius: "default",
        border: "1px solid",
        borderColor: "border",
        ":hover": {
          bg: "hover",
          filter: "brightness(95%)",
        },
      }}
      bg="bgSecondary"
      justifyContent="center"
      alignItems="center"
      py="2px"
      px={1}
      mr={1}
    >
      <Icon size={11} color={styles?.icon?.color} sx={{ ...styles?.icon }} />
      <Text variant="body" p={0} fontSize={11} ml={"2px"}>
        {text}
      </Text>
    </Flex>
  );
}
export default IconTag;
