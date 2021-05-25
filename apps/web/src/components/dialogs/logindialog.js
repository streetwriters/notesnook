import React, { useEffect, useState } from "react";
import { Flex, Button, Text } from "rebass";
import * as Icon from "../icons";
import Dialog from "./dialog";
import { useStore } from "../../stores/user-store";
import Field from "../field";
import { showForgotPasswordDialog } from "../../common/dialog-controller";
import { hashNavigate } from "../../navigation";
import useHashLocation from "../../utils/use-hash-location";

const requiredValues = ["email", "password"];
function LoginDialog(props) {
  const { onClose, title, description, positiveText, email, skipInit, force } =
    props;
  const [error, setError] = useState();
  const [, queryParams] = useHashLocation();
  const isLoggingIn = useStore((store) => store.isLoggingIn);
  const login = useStore((store) => store.login);
  const isLoggedIn = useStore((store) => store.isLoggedIn);

  useEffect(() => {
    if (isLoggedIn && !force) {
      onClose();
      if (queryParams.redirect) hashNavigate(queryParams.redirect);
    }
  }, [isLoggedIn, queryParams, force, onClose]);

  return (
    <Dialog
      isOpen={true}
      title={title || "Sign in to your account"}
      description={
        <Flex alignItems="center">
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
        </Flex>
      }
      icon={Icon.Login}
      onClose={() => onClose(false)}
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

          if (email) data.email = email;

          login(data, skipInit)
            .then(async () => {
              onClose(true);
              if (queryParams.redirect) {
                hashNavigate(queryParams.redirect);
              }
            })
            .catch((e) => setError(e.message));
        }}
        flexDirection="column"
      >
        <Field
          required
          id="email"
          label="Email"
          name="email"
          defaultValue={email}
          disabled={!!email}
          autoComplete="email"
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
        <Button
          type="button"
          variant="anchor"
          sx={{ alignSelf: "flex-start" }}
          onClick={showForgotPasswordDialog}
        >
          Forgot password?
        </Button>
        {error && <Text variant="error">{error}</Text>}
      </Flex>
    </Dialog>
  );
}
export default LoginDialog;
