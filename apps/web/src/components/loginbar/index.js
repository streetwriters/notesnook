import React from "react";
import { Flex, Text } from "rebass";
import { useStore as useUserStore } from "../../stores/user-store";
import { getRandom } from "../../utils/random";
import { showLogInDialog } from "../dialogs/logindialog";

const data = [
  "Login to start your 14-day free trial",
  "Login to sync your data",
];

function LoginBar() {
  const isLoggedIn = useUserStore((store) => store.isLoggedIn);

  if (isLoggedIn) return null;
  return (
    <Flex
      flexDirection="column"
      p={2}
      mb={2}
      width="100%"
      bg="shade"
      sx={{ cursor: "pointer" }}
      onClick={showLogInDialog}
    >
      <Text variant="body">{data[getRandom(0, data.length)]}</Text>
      <Text variant="subBody">Click here to login</Text>
    </Flex>
  );
}
export default LoginBar;
