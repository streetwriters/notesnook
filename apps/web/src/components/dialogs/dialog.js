import React from "react";
import ReactDOM from "react-dom";
import { Flex, Text, Button as RebassButton } from "rebass";
import ThemeProvider from "../theme-provider";
import * as Icon from "../icons";
import Modal from "react-modal";
import useMobile from "../../utils/use-mobile";
import { useTheme } from "emotion-theming";

function Dialog(props) {
  const isMobile = useMobile();
  const theme = useTheme();

  return (
    <Modal
      isOpen={props.isOpen || false}
      shouldCloseOnOverlayClick={true}
      onRequestClose={props?.negativeButton?.onClick}
      style={{
        content: {
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          borderWidth: 0,
          borderRadius: theme.radii["default"],
          backgroundColor: theme.colors.background,
          color: theme.colors.text,
          boxShadow: "4px 5px 18px 2px #00000038",
          width: isMobile ? "80%" : "30%",
          padding: 0,
          overflowY: "hidden",
        },
        overlay: {
          zIndex: 999,
          background: theme.colors.overlay,
        },
      }}
    >
      <Flex p={30} flexDirection="column">
        <Flex
          variant="columnCenter"
          pb={2}
          mb={3}
          sx={{ borderBottom: "1px solid", borderColor: "border" }}
        >
          <props.icon size={props.iconSize || 38} color="primary" />
          <Text variant="heading" textAlign="center" color="text" mx={1} mt={1}>
            {props.title}
          </Text>
          <Text variant="body" textAlign="center" color="gray" mx={1} mt={1}>
            {props.description}
          </Text>
        </Flex>
        {props.children}
        <Flex
          sx={{ justifyContent: props.buttonsAlignment || "flex-end" }}
          mt={3}
        >
          {props.positiveButton && (
            <RebassButton
              variant="primary"
              sx={{ opacity: props.positiveButton.disabled ? 0.7 : 1 }}
              mx={1}
              disabled={props.positiveButton.disabled || false}
              onClick={
                !props.positiveButton.disabled
                  ? props.positiveButton.onClick
                  : undefined
              }
            >
              {props.positiveButton.loading ? (
                <Icon.Loading rotate={true} color="static" />
              ) : (
                props.positiveButton.text || "OK"
              )}
            </RebassButton>
          )}
          {props.negativeButton && (
            <RebassButton
              variant="secondary"
              onClick={props.negativeButton.onClick}
            >
              {props.negativeButton.text || "Cancel"}
            </RebassButton>
          )}
        </Flex>
        {props.footer}
      </Flex>
    </Modal>
  );
}
export default Dialog;

export function showDialog(dialog) {
  const root = document.getElementById("dialogContainer");
  const perform = (resolve, result) => {
    ReactDOM.unmountComponentAtNode(root);
    resolve(result);
  };
  if (root) {
    return new Promise((resolve) => {
      const PropDialog = dialog(perform.bind(this, resolve));
      ReactDOM.render(<ThemeProvider>{PropDialog}</ThemeProvider>, root);
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
}
