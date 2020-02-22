import React from "react";
import { Flex, Box, Button } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "react-feather";
import Dialog, { showDialog } from "./dialog";

const LoginDialog = props => (
  <Dialog
    open={true}
    title={"Login"}
    icon={Icon.LogIn}
    onCloseClick={props.onClose}
    content={
      <Box my={1}>
        <Input variant="default" placeholder="Email"></Input>
        <Input
          variant="default"
          placeholder="Password"
          sx={{ marginTop: 2 }}
        ></Input>
        <Button width={1} my={2}>
          Login
        </Button>
        <Flex flexDirection="row" justifyContent="space-between">
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
