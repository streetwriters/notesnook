import React from "react";
import { Flex, Box, Button } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "react-feather";
import Dialog, { showDialog } from "./dialog";

const LoginDialog = props => (
  <Dialog
    isOpen={true}
    title={"Login"}
    icon={Icon.LogIn}
    onCloseClick={props.onClose}
    negativeButton={{ onClick: props.onClose }}
    positiveButton={{ text: "Login" }}
    content={
      <Box my={1}>
        <Input variant="default" placeholder="Email"></Input>
        <Input
          variant="default"
          placeholder="Password"
          sx={{ marginTop: 2 }}
        ></Input>
        <Flex
          flexDirection="row"
          justifyContent="space-between"
          sx={{ marginTop: 2 }}
        >
          <Button variant="links">Create a New Account</Button>
          <Button variant="links" alignItems="right">
            Forgot password?
          </Button>
        </Flex>
      </Box>
    }
  />
);

export const showLogInDialog = () => {
  return showDialog(perform => <LoginDialog onClose={() => perform(false)} />);
};
