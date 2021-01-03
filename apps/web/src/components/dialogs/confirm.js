import React from "react";
import { Box, Text } from "rebass";
import Dialog, { showDialog } from "./dialog";
import * as Icon from "../icons";

function Confirm(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      description={props.subtitle}
      onClose={props.onNo}
      positiveButton={{
        text: props.yesText,
        onClick: props.onYes,
      }}
      negativeButton={
        props.noText && { text: props.noText, onClick: props.onNo }
      }
    >
      <Box>
        <Text as="span" variant="body">
          {props.message}
        </Text>
      </Box>
    </Dialog>
  );
}

export function confirm(icon, { title, subtitle, message, yesText, noText }) {
  return showDialog((perform) => (
    <Confirm
      title={title}
      subtitle={subtitle}
      message={message}
      yesText={yesText}
      noText={noText}
      icon={icon}
      onNo={() => perform(false)}
      onYes={() => perform(true)}
    />
  ));
}

/**
 *
 * @param {"note"|"notebook"} type
 */
export function showDeleteConfirmation(type, multi = false) {
  let noun = type === "note" ? "Note" : "Notebook";
  if (multi) noun += "s";
  let lowerCaseNoun = noun.toLowerCase();

  let secondPronoun = multi ? "they" : "it";

  return confirm(Icon.Trash, {
    title: `Delete ${noun}?`,
    message: (
      <Text as="span" fontSize="body">
        The {lowerCaseNoun} will be{" "}
        <Text as="span" color="primary">
          kept in your Trash for 7 days
        </Text>{" "}
        after which {secondPronoun} will be permanently removed.
      </Text>
    ),
    yesText: `Delete ${lowerCaseNoun}`,
    noText: "Cancel",
  });
}

export function showMultiDeleteConfirmation(type) {
  let noun = type === "note" ? "Notes" : "Notebooks";

  return confirm(Icon.Trash, {
    title: `Delete these ${noun}?`,
    message: (
      <Text as="span">
        These {type}s will be{" "}
        <Text as="span" color="primary">
          kept in your Trash for 7 days
        </Text>{" "}
        after which they will be permanently removed.
      </Text>
    ),
    yesText: `Delete these ${type}s`,
    noText: "Cancel",
  });
}

export function showLogoutConfirmation() {
  return confirm(Icon.Logout, {
    title: `Logout?`,
    message:
      "Logging out will delete all local data and reset the app. Make sure you have synced your data before logging out.",
    yesText: `Yes`,
    noText: "No",
  });
}

export function showAccountDeletedNotice() {
  return confirm(Icon.Logout, {
    title: `Account deleted`,
    message:
      "You deleted your account from another device. You have been logged out.",
    yesText: `Okay`,
  });
}

export function showPasswordChangedNotice() {
  return confirm(Icon.Logout, {
    title: `Account password changed`,
    message:
      "Your account password was changed, please login again using the new password.",
    yesText: `Okay`,
  });
}

export function showAccountLoggedOutNotice(reason) {
  return confirm(Icon.Logout, {
    title: `You were logged out`,
    message: reason,
    yesText: `Okay`,
  });
}
