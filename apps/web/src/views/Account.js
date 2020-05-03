import React, { useEffect, useState } from "react";
import { Flex, Button, Text } from "rebass";
import { useStore, store } from "../stores/user-store";

function Account() {
  const logout = useStore((store) => store.logout);
  const initUser = useStore((store) => store.init);
  const [user, setUser] = useState({});
  useEffect(() => {
    initUser().then(() => {
      setUser(store.get().user);
    });
  }, [initUser]);

  return (
    <Flex variant="columnFill">
      <Text variant="title" textAlign="center" py="5px">
        {user.username}
      </Text>
      <Text variant="subtitle" textAlign="center" py="5px">
        {user.email}
      </Text>
      <Text
        alignSelf="center"
        fontSize="title"
        bg="primary"
        color="static"
        px="5px"
        my="5px"
        sx={{ borderRadius: "5px" }}
      >
        Beta
      </Text>
      <Button
        variant="list"
        onClick={async () => {
          await logout();
        }}
      >
        Logout
      </Button>
    </Flex>
  );
}

export default Account;
