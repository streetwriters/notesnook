import React, { useState } from "react";
import { Text, Box, Button } from "rebass";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { useStore } from "../../stores/user-store";
import { showLogInDialog } from "./logindialog";
import Field from "../field";

const requiredValues = ["email", "username", "password"];
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
      onClose={onClose}
      negativeButton={{ text: "Cancel", onClick: onClose }}
      buttonsAlignment="center"
      positiveButton={{
        props: {
          form: "signupForm",
          type: "submit",
        },
        text: "Create account",
        loading: isSigningIn,
        disabled: isSigningIn,
      }}
      footer={
        <>
          <Text fontSize="title" textAlign="center" color="gray" mt={3}>
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
            .then(onClose)
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
        />
        <Field
          required
          id="username"
          label="Username"
          name="username"
          sx={{ mt: 1 }}
        />
        <Field
          required
          id="password"
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          sx={{ mt: 1 }}
        />
        {error && <Text variant="error">{error}</Text>}
      </Box>
    </Dialog>
  );
}

export function showSignUpDialog() {
  return showDialog((perform) => <SignUpDialog onClose={() => perform()} />);
}
