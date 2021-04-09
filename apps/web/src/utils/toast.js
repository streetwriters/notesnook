import React from "react";
import CogoToast from "cogo-toast";
import { Button, Flex, Text } from "rebass";
import ThemeProvider from "../components/theme-provider";
import * as Icon from "../components/icons";
import { toTitleCase } from "./string";
import { store as appstore } from "../stores/app-store";
/**
 *
 * @returns {import("cogo-toast").CTReturn}
 */
function showToast(type, message, actions) {
  if (appstore.get().isFocusMode) return null;
  const IconComponent = Icon[toTitleCase(type)];
  const toast = CogoToast[type];
  if (!toast) return;
  return toast(
    <ToastContainer type={type} message={message} actions={actions} />,
    {
      position: "top-right",
      hideAfter: actions ? 5 : type === "error" ? 5 : 3,
      bar: { size: "0px" },
      renderIcon: () => {
        return (
          <ThemeProvider>
            <IconComponent color={type} />
          </ThemeProvider>
        );
      },
    }
  );
}

function ToastContainer(props) {
  const { type, message, actions } = props;
  return (
    <ThemeProvider>
      <Flex
        data-test-id="toast"
        justifyContent="center"
        alignContent="center"
        my={1}
      >
        <Text
          data-test-id="toast-message"
          variant="body"
          fontSize="menu"
          color="text"
          mr={2}
        >
          {message}
        </Text>
        {actions?.map((action) => (
          <Button
            variant="anchor"
            fontSize="menu"
            color={type}
            key={action.text}
            onClick={action.onClick}
          >
            {action.text}
          </Button>
        ))}
      </Flex>
    </ThemeProvider>
  );
}

export { showToast };
