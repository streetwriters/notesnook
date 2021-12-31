import React, { useState, useCallback, useMemo } from "react";
import { Box, Text } from "rebass";
import Dialog from "./dialog";
import Field from "../field";
import { Checkbox, Label } from "@rebass/forms";

function PasswordDialog(props) {
  const { type, checks } = props;
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const isChangePasswordDialog = useMemo(() => {
    return type === "change_password" || type === "change_account_password";
  }, [type]);

  const submit = useCallback(
    async (data) => {
      setIsLoading(true);
      setError(false);
      try {
        if (await props.validate(data)) {
          props.onDone();
        } else {
          setError("Wrong password.");
          setIsLoading(false);
        }
      } catch (e) {
        setError(e.message);
        setIsLoading(false);
      }
    },
    [props]
  );
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      icon={props.icon}
      onClose={props.onClose}
      positiveButton={{
        props: {
          form: "passwordForm",
          type: "submit",
        },
        text: props.positiveButtonText,
        loading: isLoading,
        disabled: isLoading,
      }}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      <Box
        id="passwordForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target).entries());
          setError();
          await submit(data);
        }}
      >
        <Field
          autoFocus
          required
          data-test-id="dialog-password"
          label={isChangePasswordDialog ? "Old password" : "Password"}
          type="password"
          autoComplete={
            type === "create_vault" ? "new-password" : "current-password"
          }
          id={isChangePasswordDialog ? "oldPassword" : "password"}
          name={isChangePasswordDialog ? "oldPassword" : "password"}
        />

        {isChangePasswordDialog ? (
          <Field
            required
            data-test-id="dialog-new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            id="newPassword"
            name="newPassword"
          />
        ) : null}

        {checks &&
          checks.map((check) => (
            <Label key={check.key} alignItems="center" fontSize="title" mt={2}>
              <Checkbox id={check.key} name={check.key} />
              {check.title}
            </Label>
          ))}

        {error && (
          <Text mt={1} variant={"error"}>
            {error}
          </Text>
        )}
      </Box>
    </Dialog>
  );
}
export default PasswordDialog;
