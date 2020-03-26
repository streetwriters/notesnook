import React, { useState } from "react";
import { Text } from "rebass";
import Input from "../inputs";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";
//import { db } from "../../common";
import EmailInput from "../inputs/email";
import PasswordInput from "../inputs/password";
import Form from "../form";

function SignUpDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
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
        onClick: () => {
          setError();
          if (form.error) return;
          /*  db.user
            .signup(form)
            .then(onClose)
            .catch(error => setError(`Couldn't signup. Error: ${error}`)); */
        }
      }}
    >
      <Form mt={1} gutter={2} form={form}>
        <Input autoFocus title="Username" name="username" />
        <EmailInput />
        <PasswordInput confirm />
        {error && <Text variant="error">{error}</Text>}
      </Form>
    </Dialog>
  );
}

export function showSignUpDialog() {
  return showDialog(perform => <SignUpDialog onClose={() => perform()} />);
}
