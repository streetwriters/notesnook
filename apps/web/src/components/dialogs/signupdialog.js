import React, { useState } from "react";
import { Text, Box } from "rebass";
import Input from "../inputs";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
//import { db } from "../../common";
import EmailInput from "../inputs/email";
import PasswordInput from "../inputs/password";
import Dropper from "../dropper";
import { useStore } from "../../stores/user-store";

const form = { error: true };
function SignUpDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const isSigningIn = useStore((store) => store.isSigningIn);
  const signup = useStore((store) => store.signup);

  return (
    <Dialog
      isOpen={true}
      title={"Sign Up"}
      icon={Icon.User}
      onCloseClick={onClose}
      negativeButton={{ onClick: onClose }}
      positiveButton={{
        text: "Sign Up",
        loading: isSigningIn,
        disabled: isSigningIn,
        onClick: () => submit(setError, form, signup, onClose),
      }}
    >
      <Box
        mt={1}
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
