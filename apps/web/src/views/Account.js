import React from "react";
import { Flex, Button, Image, Text } from "rebass";

function Account() {
  return (
    <Flex variant="columnFill">
      <Image
        width={1 / 4}
        alignSelf="center"
        mt="20px"
        src={process.env.PUBLIC_URL + "/square.jpg"}
        sx={{ borderRadius: 50 }}
      />
      <Text variant="title" textAlign="center" py="5px">
        {"Alex's Account"}
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
        Pro
      </Text>
      <Button variant="list">Backup</Button>
      <Button variant="list">My Devices</Button>
      <Button variant="list">Vault</Button>
      <Button variant="list">My Subscription</Button>
      <Button variant="list">Change Password</Button>
      <Button variant="list">Logout</Button>
    </Flex>
  );
}

export default Account;
