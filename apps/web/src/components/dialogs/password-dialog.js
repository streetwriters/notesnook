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
      icon={props.icon}
      content={
        <Box my={1}>
          <Input
            ref={passwordRef}
            autoFocus
            variant={isWrong ? "error" : "default"}
            type="password"
            placeholder="Enter vault password"
            onKeyUp={async e => {
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
      }
      positiveButton={{
        text: props.positiveButtonText,
        onClick: submit
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
        icon: Icon.Vault,
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

export function showPasswordDialog(type, validate) {
  const { title, icon, positiveButtonText } = getDialogData(type);
  return showDialog(perform => (
    <PasswordDialog
      title={title}
      icon={icon}
      positiveButtonText={positiveButtonText}
      onCancel={() => perform(false)}
      validate={validate}
      onDone={() => perform(true)}
    />
  ));
}
