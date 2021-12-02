import { Box, Button, Text } from "rebass";
import { Loading } from "../icons";

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
        <Loading size={12} />
        <Text variant="subBody" color="bgSecondaryText" ml={1}>
          Loading
        </Text>
      </Button>
    </Box>
  );
}

export default StatusBar;
