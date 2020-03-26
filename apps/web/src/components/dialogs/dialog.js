import React from "react";
import ReactDOM from "react-dom";
import { Flex, Text, Button as RebassButton } from "rebass";
import ThemeProvider from "../theme-provider";
import * as Icon from "../icons";
import Modal from "react-modal";

function Dialog(props) {
  return (
    <ThemeProvider>
      {theme => (
        <Modal
          isOpen={props.isOpen || false}
          shouldCloseOnOverlayClick={true}
          onRequestClose={props.negativeButton.onClick}
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
              //boxShadow: theme.shadows["3"],
              width: "25%",
              paddingRight: 20,
              paddingLeft: 20,
              overflowY: "hidden"
            },
            overlay: {
              zIndex: 999,
              background: theme.colors.overlay
            }
          }}
        >
          <Flex flexDirection="column">
            <Flex variant="rowCenter" pb={2}>
              <props.icon size={props.iconSize || 38} color="primary" />
              <Text variant="heading" color="primary" mx={1}>
                {props.title}
              </Text>
            </Flex>
            {props.children}
            <Flex variant="rowCenter" mt={3}>
              {props.positiveButton && (
                <RebassButton
                  variant="primary"
                  sx={{ opacity: props.positiveButton.disabled ? 0.7 : 1 }}
                  mx={1}
                  width={"50%"}
                  disabled={props.positiveButton.disabled || false}
                  onClick={
                    !props.positiveButton.disabled &&
                    props.positiveButton.onClick
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
                  width={"50%"}
                  onClick={props.negativeButton.onClick}
                >
                  {props.negativeButton.text || "Cancel"}
                </RebassButton>
              )}
            </Flex>
          </Flex>
        </Modal>
      )}
    </ThemeProvider>
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
    return new Promise(resolve => {
      const PropDialog = dialog(perform.bind(this, resolve));
      ReactDOM.render(PropDialog, root);
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
}
