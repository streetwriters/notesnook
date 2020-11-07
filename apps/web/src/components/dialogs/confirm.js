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
      negativeButton={{ text: props.noText, onClick: props.onNo }}
    >
      <Box my={2}>
        <Text as="span" variant="body" fontSize={18}>
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

  let [firstPronoun, secondPronoun] = multi
    ? ["these", "they"]
    : ["this", "it"];

  return confirm(Icon.Trash, {
    title: `Delete ${noun}`,
    subtitle: `Are you sure you want to delete ${firstPronoun} ${lowerCaseNoun}?`,
    message: (
      <Text as="span">
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
    title: `Delete these ${noun}`,
    subtitle: `Are you sure you want to delete these ${type}s?`,
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
    title: `Logout`,
    subtitle: `Are you sure you want to logout?`,
    message:
      "Logging out will delete all local data and reset the app. Make sure you have synced all your data before logging out.",
    yesText: `Yes`,
    noText: "No",
  });
}
