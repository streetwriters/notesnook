import React from "react";
import { Box, Flex, Text } from "rebass";
import Dialog, { showDialog } from "./dialog";
import * as Icon from "../icons";

function Confirm(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      scrollable
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

export function confirm(
  icon,
  { title, subtitle, message, yesText, noText, yesAction }
) {
  return showDialog((perform) => (
    <Confirm
      title={title}
      subtitle={subtitle}
      message={message}
      yesText={yesText}
      noText={noText}
      icon={icon}
      onNo={() => perform(false)}
      onYes={() => {
        if (yesAction) yesAction();
        perform(true);
      }}
    />
  ));
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

// export function showAccountDeletedNotice() {
//   return confirm(Icon.Logout, {
//     title: `Account deleted`,
//     message:
//       "You deleted your account from another device. You have been logged out.",
//     yesText: `Okay`,
//   });
// }

// export function showPasswordChangedNotice() {
//   return confirm(Icon.Logout, {
//     title: `Account password changed`,
//     message:
//       "Your account password was changed, please login again using the new password.",
//     yesText: `Okay`,
//   });
// }

export function showAccountLoggedOutNotice(reason) {
  return confirm(Icon.Logout, {
    title: reason,
    message: `You were logged out`,
    yesText: `Okay`,
  });
}

export function showAppUpdatedNotice(version) {
  return confirm(Icon.Update, {
    title: `Welcome to v${version.formatted}`,
    message: (
      <Flex
        flexDirection="column"
        bg="bgSecondary"
        p={1}
        sx={{ borderRadius: "default" }}
      >
        <Text variant="title">Changelog:</Text>
        <Text
          as="pre"
          overflow="auto"
          fontFamily="monospace"
          variant="body"
          mt={1}
        >
          {version.changelog || "No change log."}
        </Text>
      </Flex>
    ),
    yesText: `Yay!`,
  });
}

export function showAppAvailableNotice(version) {
  return confirm(Icon.Update, {
    title: `New version available`,
    message: (
      <Flex
        flexDirection="column"
        bg="bgSecondary"
        p={1}
        sx={{ borderRadius: "default" }}
      >
        <Text variant="title">v{version.formatted} changelog:</Text>
        <Text
          overflow="auto"
          as="pre"
          fontFamily="monospace"
          variant="body"
          mt={1}
          sx={{ overflow: "auto" }}
        >
          {version.changelog || "No change log."}
        </Text>
      </Flex>
    ),
    yesText: `Update now`,
    yesAction: () => window.location.reload(),
  });
}
