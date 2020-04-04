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

function SignUpDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const isSigningIn = useStore((store) => store.isSigningIn);
  const signup = useStore((store) => store.signup);
  const form = { error: true };

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
        onClick: () => {
          setError();
          if (form.error) return;
          signup(form)
            .then(onClose)
            .catch((e) => setError(e.message));
        },
      }}
    >
      <Box mt={1}>
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

export function showSignUpDialog() {
  return showDialog((perform) => <SignUpDialog onClose={() => perform()} />);
}
