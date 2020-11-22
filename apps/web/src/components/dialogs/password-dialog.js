import React, { useState, useCallback, useMemo } from "react";
import { Box, Text } from "rebass";
import Dialog, { showDialog } from "./dialog";
import * as Icon from "../icons";
import Field from "../field";

const requiredValues = ["password", "newPassword", "oldPassword"];
function PasswordDialog(props) {
  const { type } = props;
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);

  const isChangePasswordDialog = useMemo(() => type === "change_password", [
    type,
  ]);

  const submit = useCallback(
    async (data) => {
      setIsLoading(true);
      setError(false);
      try {
        if (await props.validate(data)) {
          props.onDone();
        } else {
          setError("Wrong password.");
        }
      } catch (e) {
        setError("Wrong password.");
      } finally {
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
      onClose={props.onCancel}
      positiveButton={{
        props: {
          form: "passwordForm",
          type: "submit",
        },
        text: props.positiveButtonText,
        loading: isLoading,
        disabled: isLoading,
      }}
      negativeButton={{ text: "Cancel", onClick: props.onCancel }}
    >
      <Box
        id="passwordForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = requiredValues.reduce((prev, curr) => {
            if (!e.target[curr]) return prev;
            prev[curr] = e.target[curr].value;
            return prev;
          }, {});

          setError();

          await submit(data);
        }}
      >
        <Field
          autoFocus
          required
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
            label="New password"
            type="password"
            autoComplete="new-password"
            id="newPassword"
            name="newPassword"
          />
        ) : null}

        {error && (
          <Text mt={1} variant={"error"}>
            {error}
          </Text>
        )}
      </Box>
    </Dialog>
  );
}

function getDialogData(type) {
  switch (type) {
    case "create_vault":
      return {
        title: "Create Your Vault",
        subtitle: "A vault stores your notes in a password-encrypted storage.",
        icon: Icon.Vault,
        positiveButtonText: "Create vault",
      };
    case "unlock_vault":
      return {
        title: "Unlock your Vault",
        subtitle: "Your vault will remain unlocked for 30 minutes.",
        icon: Icon.Unlock,
        positiveButtonText: "Unlock vault",
      };
    case "unlock_note":
      return {
        title: "Unlock Note",
        subtitle: "Unlocking will make this note openly available.",
        icon: Icon.Unlock,
        positiveButtonText: "Unlock note",
      };
    case "change_password":
      return {
        title: "Change Vault Password",
        subtitle:
          "All locked notes will be re-encrypted with the new password.",
        icon: Icon.Unlock,
        positiveButtonText: "Change password",
      };
    default:
      return;
  }
}

export function showPasswordDialog(type, validate) {
  const { title, subtitle, icon, positiveButtonText } = getDialogData(type);
  return showDialog((perform) => (
    <PasswordDialog
      type={type}
      title={title}
      subtitle={subtitle}
      icon={icon}
      positiveButtonText={positiveButtonText}
      onCancel={() => perform(false)}
      validate={validate}
      onDone={() => perform(true)}
    />
  ));
}
