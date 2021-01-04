import React, { useState } from "react";
import { Text, Box, Button, Flex } from "rebass";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { useStore } from "../../stores/user-store";
import { showLogInDialog } from "./logindialog";
import Field from "../field";
import { showRecoveryKeyDialog } from "./recoverykeydialog";

const requiredValues = ["email", "password"];
function SignUpDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const isSigningIn = useStore((store) => store.isSigningIn);
  const signup = useStore((store) => store.signup);

  return (
    <Dialog
      isOpen={true}
      title={"Create a new Account"}
      description={
        <Flex alignItems="center">
          <Text fontSize="body" textAlign="center" color="gray" mr="3px">
            Already have an account?
          </Text>
          <Button variant="anchor" fontSize="body" onClick={showLogInDialog}>
            Sign in here.
          </Button>
        </Flex>
      }
      icon={Icon.Signup}
      onClose={onClose}
      scrollable
      negativeButton={{ text: "Cancel", onClick: onClose }}
      positiveButton={{
        props: {
          form: "signupForm",
          type: "submit",
        },
        text: "Create account",
        loading: isSigningIn,
        disabled: isSigningIn,
      }}
    >
      <Box
        id="signupForm"
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = requiredValues.reduce((prev, curr) => {
            prev[curr] = e.target[curr].value;
            return prev;
          }, {});

          setError();

          signup(data)
            .then(async () => {
              // Instantiate PasswordCredential with the form
              if (window.PasswordCredential) {
                var c = new window.PasswordCredential({
                  id: data.email,
                  name: data.email,
                  type: "password",
                  password: data.password,
                });
                await navigator.credentials.store(c);
              }
              onClose(true);
            })
            .catch((e) => setError(e.message));
        }}
      >
        <Field
          autoFocus
          required
          id="email"
          type="email"
          label="Email"
          name="email"
          autoComplete="email"
        />
        <Field
          required
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          validatePassword
          sx={{ mt: 1 }}
        />
        {error && <Text variant="error">{error}</Text>}
      </Box>
    </Dialog>
  );
}

export function showSignUpDialog() {
  return showDialog((perform) => (
    <SignUpDialog
      onClose={async (res) => {
        perform(res);
        if (res) await showRecoveryKeyDialog();
      }}
    />
  ));
}
