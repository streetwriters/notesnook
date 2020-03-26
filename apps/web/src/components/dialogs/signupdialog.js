import React, { useState } from "react";
import { Flex, Box, Text } from "rebass";
import { Input } from "@rebass/forms";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { db } from "../../common";

function SignUpDialog(props) {
  const [username, setUserName] = useState();
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [confirmPassword, setConfirmPassword] = useState();
  const [errorMessage, setErrorMessage] = useState();
  return (
    <Dialog
      isOpen={true}
      title={"Sign Up"}
      icon={Icon.User}
      onCloseClick={props.onClose}
      negativeButton={{ onClick: props.onClose }}
      positiveButton={{
        text: "Sign Up",
        onClick: () => {
          setErrorMessage();

          if (username === "" || username === undefined) {
            setErrorMessage("Please enter your username.");
            return;
          }

          if (email === "" || email === undefined) {
            setErrorMessage("Please enter your email address.");
            return;
          }

          if (password !== confirmPassword) {
            setErrorMessage("Passwords do not match! Please try again.");
            return;
          }

          if (password === undefined || password === "") {
            setErrorMessage("Please enter password.");
            return;
          }

          db.user
            .signup(username, email, password)
            .then(() => {
              props.onClose();
            })
            .catch(() => {
              setErrorMessage("Couldn't signup. Please try again.");
            });
        }
      }}
      content={
        <Box my={1}>
          <Input
            variant="default"
            placeholder="Username"
            onChange={e => {
              setUserName(e.target.value);
            }}
          ></Input>
          <Input
            variant="default"
            placeholder="Email"
            sx={{ marginTop: 2 }}
            onChange={e => {
              setEmail(e.target.value);
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
          <Input
            type="password"
            variant="default"
            placeholder="Confirm Password"
            sx={{ marginTop: 2 }}
            onChange={e => {
              setConfirmPassword(e.target.value);
            }}
          ></Input>
          <Flex
            flexDirection="row"
            justifyContent="space-between"
            sx={{ marginTop: 2 }}
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
}

export function showSignUpDialog() {
  return showDialog(perform => <SignUpDialog onClose={() => perform()} />);
}
