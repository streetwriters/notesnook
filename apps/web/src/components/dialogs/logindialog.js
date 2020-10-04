import React, { useState } from "react";
import { Flex, Button, Text } from "rebass";
import Input from "../inputs";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { showSignUpDialog } from "./signupdialog";
import { useStore } from "../../stores/user-store";
import PasswordInput from "../inputs/password";
import Dropper from "../dropper";

const form = { error: true };
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
        text: "Sign me in",
        loading: isLoggingIn,
        disabled: isLoggingIn,
        onClick: () => submit(setError, form, login, onClose),
      }}
      buttonsAlignment="center"
      footer={
        <>
          <Text textAlign="center" color="gray" mt={3}>
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
        variant="columnFill"
        onKeyDown={(e) => {
          if (e.key === "Enter") submit(setError, form, login, onClose);
        }}
      >
        <Dropper mt={2} form={form}>
          <Input autoFocus name="username" title="Username" />
          <PasswordInput />
        </Dropper>
        {error && <Text variant="error">{error}</Text>}
        {/* <Button variant="anchor" onClick={showSignUpDialog}>
          I don't have an account
        </Button> */}
      </Flex>
    </Dialog>
  );
}

function submit(setError, form, login, onClose) {
  setError();
  if (form.error) return;

  login(form)
    .then(onClose)
    .catch((e) => setError(e.message));
}

export const showLogInDialog = () => {
  return showDialog((perform) => <LoginDialog onClose={() => perform()} />);
};
