import { Flex } from "rebass";
import Loader from "../loader";

function NavigationMenu() {
  return (
    <Flex
      id="navigationmenu"
      flexDirection="column"
      justifyContent="space-between"
      flex={1}
      sx={{
        borderRight: "1px solid",
        borderRightColor: "border",
        zIndex: 1,
        height: "auto",
        position: "relative",
      }}
      bg={"bgSecondary"}
    >
      <Loader />
    </Flex>
  );
}
export default NavigationMenu;
