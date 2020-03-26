import React, { useState } from "react";
import { Box, Button, Text } from "rebass";
import Input from "../inputs";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
import { showSignUpDialog } from "./signupdialog";
import { useStore } from "../../stores/user-store";
import PasswordInput from "../inputs/password";
import Dropper from "../dropper";

function LoginDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const isLoggingIn = useStore(store => store.isLoggingIn);
  const login = useStore(store => store.login);
  const form = { error: true };

  return (
    <Dialog
      isOpen={true}
      title={"Login"}
      icon={Icon.Login}
      onCloseClick={onClose}
      negativeButton={{ onClick: onClose }}
      positiveButton={{
        text: "Login",
        loading: isLoggingIn,
        disabled: isLoggingIn,
        onClick: () => {
          setError();
          if (!form.error) return;
          login(form)
            .then(onClose)
            .catch(e => setError(e.message));
        }
      }}
    >
      <Box mt={1}>
        <Dropper mt={2} form={form}>
          <Input autoFocus name="username" title="Username" />
          <PasswordInput />
        </Dropper>
        <Button variant="anchor" onClick={showSignUpDialog}>
          Create a New Account
        </Button>
        {error && <Text variant="error">{error}</Text>}
      </Box>
    </Dialog>
  );
}

export const showLogInDialog = () => {
  return showDialog(perform => <LoginDialog onClose={() => perform()} />);
};
