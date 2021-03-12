import React, { useState } from "react";
import { Text, Box, Button, Flex } from "rebass";
import * as Icon from "../icons";
import Dialog from "./dialog";
import { useStore } from "../../stores/user-store";
import { showLogInDialog } from "../../common/dialog-controller";
import Field from "../field";

const requiredValues = ["email", "password"];
function SignUpDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const [passwordError, setPasswordError] = useState();
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
          if (passwordError) {
            setError("Please resolve all errors before continuing.");
            return;
          }

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
          onError={setPasswordError}
          sx={{ mt: 1 }}
        />
        <Text variant="body" fontSize="body" mt={2}>
          By signing up on Notesnook you agree to our{" "}
          <Text as="a" color="primary" href="https://notesnook.com/tos">
            terms of service
          </Text>{" "}
          &amp;{" "}
          <Text as="a" color="primary" href="https://notesnook.com/privacy">
            privacy policy
          </Text>
          .
        </Text>
        {error && typeof error === "string" && (
          <Text variant="error" fontSize="body" mt={2}>
            {error}
          </Text>
        )}
      </Box>
    </Dialog>
  );
}
export default SignUpDialog;
