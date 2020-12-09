import React, { useEffect, useState } from "react";
import { Flex, Button, Text } from "rebass";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { showSignUpDialog } from "./signupdialog";
import { useStore } from "../../stores/user-store";
import Field from "../field";
import { Checkbox, Label } from "@rebass/forms";

const requiredValues = ["username", "password", "remember"];
function LoginDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const [credential, setCredential] = useState();
  const [username, setUsername] = useState();
  const isLoggingIn = useStore((store) => store.isLoggingIn);
  const login = useStore((store) => store.login);

  useEffect(() => {
    if (!window.PasswordCredential) return;
    (async function () {
      const credential = await navigator.credentials.get({
        mediation: "optional",
        password: true,
      });
      if (credential) {
        setCredential(credential);
        if (!credential.password) {
          setUsername(credential.id);
        } else {
          await login({
            password: credential.password,
            username: credential.id,
            remember: true,
          });
          onClose();
        }
      }
    })();
  }, [login, onClose]);
  return (
    <Dialog
      isOpen={true}
      title={
        credential?.password
          ? `Signing in as ${credential.id}...`
          : "Sign in to Your Account"
      }
      description={
        <Flex alignItems="center">
          {credential?.password ? (
            <Text as="span" fontSize="body" color="gray">
              Please wait...
            </Text>
          ) : (
            <Text as="span" fontSize="body" color="gray">
              Don't have an account?{" "}
              <Button
                variant="anchor"
                sx={{ textAlign: "left" }}
                fontSize="body"
                onClick={showSignUpDialog}
              >
                Create an account here.
              </Button>
            </Text>
          )}
        </Flex>
      }
      icon={Icon.Login}
      onClose={onClose}
      scrollable
      negativeButton={{
        text: "Cancel",
        disabled: isLoggingIn,
        onClick: onClose,
      }}
      positiveButton={{
        props: {
          form: "loginForm",
          type: "submit",
        },
        text: "Sign in",
        loading: isLoggingIn,
        disabled: isLoggingIn,
      }}
    >
      {!credential?.password && (
        <Flex
          id="loginForm"
          as="form"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.target);
            const data = requiredValues.reduce((prev, curr) => {
              prev[curr] = form.get(curr);
              return prev;
            }, {});

            setError();

            login(data)
              .then(async () => {
                // Instantiate PasswordCredential with the form
                if (window.PasswordCredential) {
                  var c = new window.PasswordCredential({
                    id: data.username,
                    name: data.username,
                    type: "password",
                    password: data.password,
                  });
                  await navigator.credentials.store(c);
                  onClose();
                } else {
                  onClose();
                }
              })
              .catch((e) => setError(e.message));
          }}
          flexDirection="column"
        >
          <Field
            autoFocus={!username}
            required
            id="username"
            label="Username"
            name="username"
            autoComplete="username"
            defaultValue={username}
          />
          <Field
            autoFocus={!!username}
            required
            id="password"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            sx={{ mt: 1 }}
          />
          {error && <Text variant="error">{error}</Text>}
          <Label mt={1} fontSize="body" alignItems="center">
            <Checkbox id="remember" name="remember" defaultChecked />
            Keep me logged in
          </Label>
        </Flex>
      )}
    </Dialog>
  );
}

export const showLogInDialog = () => {
  return showDialog((perform) => <LoginDialog onClose={() => perform()} />);
};
