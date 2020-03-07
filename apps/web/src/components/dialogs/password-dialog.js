import React from "react";
import { Box } from "rebass";
import { Input } from "@rebass/forms";
import Dialog, { showDialog } from "./dialog";
import * as Icon from "react-feather";

function PasswordDialog(props) {
  let password = "";
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      content={
        <Box my={1}>
          <Input
            variant="default"
            type="password"
            onChange={e => (password = e.target.value)}
            placeholder="Enter vault password"
          />
        </Box>
      }
      positiveButton={{
        text: props.positiveButtonText,
        onClick: () => props.onDone(password)
      }}
      negativeButton={{ text: "Cancel", onClick: props.onCancel }}
    />
  );
}

function getDialogData(type) {
  switch (type) {
    case "create_vault":
      return {
        title: "Set Up Your Vault",
        icon: Icon.Shield,
        positiveButtonText: "Done"
      };
    case "unlock_vault":
      return {
        title: "Unlock Vault",
        icon: Icon.Unlock,
        positiveButtonText: "Unlock"
      };
    case "unlock_note":
      return {
        title: "Unlock Note",
        icon: Icon.Unlock,
        positiveButtonText: "Unlock"
      };
    default:
      return;
  }
}

export const showPasswordDialog = type => {
  const { title, icon, positiveButtonText } = getDialogData(type);
  return showDialog(perform => (
    <PasswordDialog
      title={title}
      icon={icon}
      positiveButtonText={positiveButtonText}
      onCancel={() => perform()}
      onDone={password => perform(password)}
    />
  ));
};
