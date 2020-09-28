import React, { useState, useRef, useCallback } from "react";
import { Box, Text, Flex } from "rebass";
import { Input } from "@rebass/forms";
import Dialog, { showDialog } from "./dialog";
import * as Icon from "../icons";

function PasswordDialog(props) {
  const [isWrong, setIsWrong] = useState(false);
  const passwordRef = useRef();
  const submit = useCallback(async () => {
    const password = passwordRef.current.value;
    if (await props.validate(password)) {
      props.onDone();
    } else {
      setIsWrong(true);
      passwordRef.current.focus();
    }
  }, [setIsWrong, props]);
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      icon={props.icon}
      positiveButton={{
        text: props.positiveButtonText,
        onClick: submit,
      }}
      negativeButton={{ text: "Cancel", onClick: props.onCancel }}
    >
      <Box my={1}>
        <Input
          data-test-id="dialog-vault-pass"
          ref={passwordRef}
          autoFocus
          variant={isWrong ? "error" : "input"}
          type="password"
          placeholder="Enter vault password"
          onKeyUp={async (e) => {
            if (e.key === "Enter") {
              await submit();
            } else {
              setIsWrong(false);
            }
          }}
        />
        {isWrong && (
          <Flex alignItems="center" color="error" mt={2}>
            <Icon.Alert size={16} color="error" />
            <Text ml={1} fontSize={"subBody"}>
              Wrong password
            </Text>
          </Flex>
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
        subtitle: "Your vault will encrypt everything locally.",
        icon: Icon.Vault,
        positiveButtonText: "Create my vault",
      };
    case "unlock_vault":
      return {
        title: "Unlock your Vault",
        subtitle: "Your vault will remain unlocked for 30 minutes.",
        icon: Icon.Unlock,
        positiveButtonText: "Unlock my vault",
      };
    case "unlock_note":
      return {
        title: "Unlock your Note",
        subtitle: "Unlocking will make this note openly available.",
        icon: Icon.Unlock,
        positiveButtonText: "Unlock this note",
      };
    default:
      return;
  }
}

export function showPasswordDialog(type, validate) {
  const { title, subtitle, icon, positiveButtonText } = getDialogData(type);
  return showDialog((perform) => (
    <PasswordDialog
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
