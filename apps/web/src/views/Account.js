import React from "react";
import { Flex, Button, Image, Text } from "rebass";

function Account() {
  return (
    <Flex flexDirection="column" flex="1 1 auto">
      <Flex flexDirection="column" flex="1 1 auto">
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
        <Flex justifyContent="center">
          <Text
            alignSelf="center"
            fontSize="title"
            bg="primary"
            color="static"
            px="5px"
            my="5px"
            sx={{ borderRadius: "5px" }}
          >
            {"Pro"}
          </Text>
        </Flex>
        <Button variant="setting">Backup</Button>
        <Button variant="setting">My Devices</Button>
        <Button variant="setting">Vault</Button>
        <Button variant="setting">My Subscription</Button>
        <Button variant="setting">Change Password</Button>
        <Button variant="setting">Logout</Button>
      </Flex>
    </Flex>
  );
}

export default Account;
