import React, { useEffect, useState } from "react";
import { Flex, Button, Text } from "rebass";
import * as Icon from "../icons";
import Dialog from "./dialog";
import { useStore } from "../../stores/user-store";
import Field from "../field";
import { Checkbox, Label } from "@rebass/forms";
import { showForgotPasswordDialog } from "../../common/dialog-controller";
import { hashNavigate } from "../../navigation";
import useHashLocation from "../../utils/use-hash-location";

const requiredValues = ["email", "password", "remember"];
function LoginDialog(props) {
  const { onClose, title, description, positiveText, skipInit } = props;
  const [error, setError] = useState();
  const [, queryParams] = useHashLocation();
  const [credential, setCredential] = useState();
  const [email, setEmail] = useState();
  const isLoggingIn = useStore((store) => store.isLoggingIn);
  const login = useStore((store) => store.login);
  const isLoggedIn = useStore((store) => store.isLoggedIn);

  useEffect(() => {
    if (isLoggedIn) {
      onClose();
      if (queryParams.redirect) hashNavigate(queryParams.redirect);
    }
  }, [isLoggedIn, queryParams, onClose]);

  useEffect(() => {
    if (isLoggedIn) {
      onClose();
    }
  }, [isLoggedIn, onClose]);

  useEffect(() => {
    if (!window.PasswordCredential) return;
    (async function () {
      const credential = await navigator.credentials.get({
        mediation: "required",
        password: true,
      });
      if (credential) {
        setCredential(credential);
        if (!credential.password) {
          setEmail(credential.id);
        } else {
          try {
            await login({
              password: credential.password,
              email: credential.id,
              remember: true,
            });
            onClose();
          } catch (e) {
            setEmail(credential.id);
            setCredential();
            setError(e.message);
          }
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
          : title || "Sign in to your account"
      }
      description={
        <Flex alignItems="center">
          {credential?.password ? (
            <Text as="span" fontSize="body" color="gray">
              Please wait...
            </Text>
          ) : (
            <Text as="span" fontSize="body" color="gray">
              {description ? (
                description
              ) : (
                <>
                  Don't have an account?{" "}
                  <Button
                    variant="anchor"
                    sx={{ textAlign: "left" }}
                    fontSize="body"
                    onClick={() => hashNavigate("/signup")}
                  >
                    Create an account here.
                  </Button>
                </>
              )}
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
        text: positiveText || "Sign in",
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

            login(data, skipInit)
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
                  onClose();
                } else {
                  onClose();
                }
                if (queryParams.redirect) {
                  hashNavigate(queryParams.redirect);
                }
              })
              .catch((e) => setError(e.message));
          }}
          flexDirection="column"
        >
          <Field
            autoFocus={!email}
            required
            id="email"
            label="Email"
            name="email"
            autoComplete="email"
            defaultValue={email}
          />
          <Field
            autoFocus={!!email}
            required
            id="password"
            label="Password"
            name="password"
            type="password"
            autoComplete="current-password"
            sx={{ mt: 1 }}
          />
          <Button
            type="button"
            variant="anchor"
            sx={{ alignSelf: "flex-start" }}
            onClick={showForgotPasswordDialog}
          >
            Forgot password?
          </Button>
          {error && <Text variant="error">{error}</Text>}
          <Label mt={1} fontSize="body" alignItems="center" color="text">
            <Checkbox id="remember" name="remember" defaultChecked />
            Keep me logged in
          </Label>
        </Flex>
      )}
    </Dialog>
  );
}
export default LoginDialog;
