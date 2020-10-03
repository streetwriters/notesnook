import React, { useState } from "react";
import { Text, Box, Button } from "rebass";
import Input from "../inputs";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
//import { db } from "../../common";
import EmailInput from "../inputs/email";
import PasswordInput from "../inputs/password";
import Dropper from "../dropper";
import { useStore } from "../../stores/user-store";
import { showLogInDialog } from "./logindialog";

const form = { error: true };
function SignUpDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const isSigningIn = useStore((store) => store.isSigningIn);
  const signup = useStore((store) => store.signup);

  return (
    <Dialog
      isOpen={true}
      title={"Create a new Account"}
      description={"Sign up for a 14-day free trial (no credit card)."}
      icon={Icon.Signup}
      onCloseClick={onClose}
      negativeButton={{ text: "Cancel", onClick: onClose }}
      buttonsAlignment="center"
      positiveButton={{
        text: "Create my account",
        loading: isSigningIn,
        disabled: isSigningIn,
        onClick: () => submit(setError, form, signup, onClose),
      }}
      footer={
        <>
          <Text textAlign="center" color="gray" mt={3}>
            Already have an account?
          </Text>
          <Button
            variant="anchor"
            mt={2}
            fontSize="body"
            onClick={showLogInDialog}
          >
            Sign in here.
          </Button>
        </>
      }
    >
      <Box
        onKeyDown={(e) => {
          if (e.key === "Enter") submit(setError, form, signup, onClose);
        }}
      >
        <Dropper mt={2} form={form}>
          <Input autoFocus title="Username" name="username" />
          <EmailInput />
          <PasswordInput confirm />
        </Dropper>
        {error && <Text variant="error">{error}</Text>}
      </Box>
    </Dialog>
  );
}

function submit(setError, form, signup, onClose) {
  setError();
  if (form.password !== form.confirm) {
    form.error = true;
    setError("Passwords do not match.");
  }
  if (form.error) return;
  signup(form)
    .then(onClose)
    .catch((e) => setError(e.message));
}

export function showSignUpDialog() {
  return showDialog((perform) => <SignUpDialog onClose={() => perform()} />);
}

/**

 */
