import React, { useState } from "react";
import { Flex, Button, Text } from "rebass";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { showSignUpDialog } from "./signupdialog";
import { useStore } from "../../stores/user-store";
import Field from "../field";

const requiredValues = ["username", "password"];
function LoginDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const isLoggingIn = useStore((store) => store.isLoggingIn);
  const login = useStore((store) => store.login);

  return (
    <Dialog
      isOpen={true}
      title={"Sign in to Your Account"}
      description={"Signing in allows you to sync your notes across devices."}
      icon={Icon.Login}
      onClose={onClose}
      negativeButton={{ text: "Cancel", onClick: onClose }}
      positiveButton={{
        props: {
          form: "loginForm",
          type: "submit",
        },
        text: "Sign in",
        loading: isLoggingIn,
        disabled: isLoggingIn,
        // onClick: () => {
        //   console.log(document.getElementById("loginForm"));
        // }, //submit(setError, form, login, onClose),
      }}
      buttonsAlignment="center"
      footer={
        <>
          <Text fontSize="title" textAlign="center" color="gray" mt={3}>
            Don't have an account?
          </Text>
          <Button
            mt={3}
            variant="anchor"
            justifySelf="center"
            alignSelf="center"
            fontSize="body"
            onClick={showSignUpDialog}
          >
            Sign up here
          </Button>
        </>
      }
    >
      <Flex
        id="loginForm"
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = requiredValues.reduce((prev, curr) => {
            prev[curr] = e.target[curr].value;
            return prev;
          }, {});

          setError();

          login(data)
            .then(onClose)
            .catch((e) => setError(e.message));
        }}
        variant="columnFill"
      >
        <Field
          autoFocus
          required
          id="username"
          label="Username"
          name="username"
          autoComplete="username"
        />
        <Field
          required
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          sx={{ mt: 1 }}
        />
        {error && <Text variant="error">{error}</Text>}
      </Flex>
    </Dialog>
  );
}

export const showLogInDialog = () => {
  return showDialog((perform) => <LoginDialog onClose={() => perform()} />);
};
