import React, { useEffect, useState } from "react";
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
  const [credential, setCredential] = useState();
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
      }
    })();
  }, [login]);
  return (
    <Dialog
      isOpen={true}
      title={"Sign in to Your Account"}
      description={
        <Flex alignItems="center">
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
        </Flex>
      }
      icon={Icon.Login}
      onClose={onClose}
      scrollable
      negativeButton={{ text: "Cancel", onClick: onClose }}
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
      <Flex flexDirection="column">
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
              .then(async () => {
                // Instantiate PasswordCredential with the form
                if (window.PasswordCredential) {
                  var c = new window.PasswordCredential({
                    id: data.email,
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
        {credential && (
          <Button
            variant="tertiary"
            mt={2}
            sx={{ textAlign: "left" }}
            onClick={async () => {
              if (!credential.password) {
                const element = document.querySelector("#loginForm #username");
                if (!element) {
                  return setCredential();
                }
                element.value = credential.name;
              } else {
                await login({
                  password: credential.password,
                  username: credential.name,
                });
                onClose();
              }
            }}
          >
            <Text as="span">
              Login as <b>{credential.name}</b>
              {credential.id && <Text variant="subBody">{credential.id}</Text>}
            </Text>
          </Button>
        )}
      </Flex>
    </Dialog>
  );
}

export const showLogInDialog = () => {
  return showDialog((perform) => <LoginDialog onClose={() => perform()} />);
};
