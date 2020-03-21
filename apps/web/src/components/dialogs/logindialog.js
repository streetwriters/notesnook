import React, { useState } from "react";
import { Flex, Box, Button, Text } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { showSignUpDialog } from "./signupdialog";
import { useStore } from "../../stores/user-store";

const LoginDialog = props => {
  const [username, setUsername] = useState();
  const [password, setPassword] = useState();
  const [errorMessage, setErrorMessage] = useState();
  const isLoggingIn = useStore(store => store.isLoggingIn);
  const login = useStore(store => store.login);
  return (
    <Dialog
      isOpen={true}
      title={"Login"}
      icon={Icon.Login}
      onCloseClick={props.onClose}
      negativeButton={{ onClick: props.onClose }}
      positiveButton={{
        text: "Login",
        loading: isLoggingIn,
        disabled: isLoggingIn,
        onClick: () => {
          setErrorMessage();
          if (username === "" || username === undefined) {
            setErrorMessage("Please enter your username.");
            return;
          }

          if (password === "" || password === undefined) {
            setErrorMessage("Please enter your password.");
            return;
          }

          login(username, password)
            .then(() => {
              props.onClose();
            })
            .catch(e => {
              setErrorMessage(e.message);
            });
        }
      }}
      content={
        <Box my={1}>
          <Input
            autoFocus
            variant="default"
            placeholder="Username"
            onChange={e => {
              setUsername(e.target.value);
            }}
          ></Input>
          <Input
            type="password"
            variant="default"
            placeholder="Password"
            sx={{ marginTop: 2 }}
            onChange={e => {
              setPassword(e.target.value);
            }}
          ></Input>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            sx={{ marginTop: 2 }}
          >
            <Button
              variant="links"
              onClick={() => {
                showSignUpDialog();
              }}
            >
              Create a New Account
            </Button>
          </Flex>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            sx={{ marginTop: errorMessage ? 2 : 0 }}
          >
            <Text
              fontSize="subBody"
              color="red"
              sx={{ display: errorMessage ? "flex" : "none" }}
            >
              {errorMessage}
            </Text>
          </Flex>
        </Box>
      }
    />
  );
};

export const showLogInDialog = () => {
  return showDialog(perform => <LoginDialog onClose={() => perform()} />);
};
