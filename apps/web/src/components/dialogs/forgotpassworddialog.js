import React, { useState } from "react";
import { Text, Box } from "rebass";
import Dialog from "./dialog";
import Field from "../field";
import { db } from "../../common";
import { showToast } from "../../utils/toast";

const requiredValues = ["email"];
function ForgotPasswordDialog(props) {
  const { onClose } = props;
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Dialog
      isOpen={true}
      title={"Recover your account"}
      description={
        "Forgot your password? No worries, we can help you recover your account."
      }
      onClose={onClose}
      scrollable
      negativeButton={{ text: "Cancel", onClick: onClose }}
      positiveButton={{
        props: {
          form: "signupForm",
          type: "submit",
        },
        text: "Continue",
        disabled: isLoading,
        loading: isLoading,
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
          setIsLoading(true);
          db.user
            .recoverAccount(data.email)
            .then(() => {
              showToast(
                "success",
                "Recovery email sent. Please check your inbox."
              );
              onClose();
            })
            .catch((e) => setError(e.message))
            .finally(() => setIsLoading(false));
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
          helpText="We will email you a 6-digit code to verify that it's you."
        />
        {error && <Text variant="error">{error}</Text>}
      </Box>
    </Dialog>
  );
}
export default ForgotPasswordDialog;
