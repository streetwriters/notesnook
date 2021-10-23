import { Box, Button, Text } from "rebass";
import { Circle } from "../icons";

function StatusBar() {
  return (
    <Box
      bg="bgSecondary"
      display={["none", "flex"]}
      sx={{ borderTop: "1px solid", borderTopColor: "border" }}
      justifyContent="space-between"
      px={2}
    >
      <Button
        variant="statusitem"
        display="flex"
        sx={{ alignItems: "center", justifyContent: "center" }}
      >
        <Circle size={7} color="error" />
        <Text variant="subBody" color="bgSecondaryText" ml={1}>
          Not logged in
        </Text>
      </Button>
    </Box>
  );
}

export default StatusBar;
