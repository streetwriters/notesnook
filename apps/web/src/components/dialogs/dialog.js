import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Flex, Box, Text, Button as RebassButton, Button } from "rebass";
import { Input, Checkbox, Label } from "@rebass/forms";
import * as Icon from "react-feather";
import { ThemeProvider } from "../../utils/theme";
import { db } from "../../common";
import Modal from "react-modal";

export default class Dialog extends React.Component {
  render() {
    const props = this.props;
    return (
      <ThemeProvider>
        {theme => (
          <Modal
            isOpen={true}
            shouldCloseOnOverlayClick={true}
            onRequestClose={props.closeCick}
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
                boxShadow: theme.shadows["3"],
                width: "25%",
                paddingRight: 40,
                paddingLeft: 40,
                overflowY: "hidden"
              },
              overlay: {
                zIndex: 999,
                background: theme.colors.overlay
              }
            }}
          >
            <Flex flexDirection="column">
              <Flex
                flexDirection="row"
                alignItems="center"
                alignSelf="center"
                justifyContent="center"
                color="primary"
                py={2}
              >
                <Box height={props.iconSize || 32}>
                  <props.icon size={props.iconSize || 32} />
                </Box>
                <Text
                  mx={2}
                  as="span"
                  variant="title"
                  fontSize={22}
                  textAlign="center"
                >
                  {props.title}
                </Text>
              </Flex>
              {props.content}
              <Flex
                flexDirection="row"
                my={1}
                justifyContent="center"
                alignItems="center"
              >
                {props.positiveButton && (
                  <RebassButton
                    variant="primary"
                    sx={{ opacity: props.positiveButton.disabled ? 0.7 : 1 }}
                    mx={1}
                    width={"25%"}
                    disabled={props.positiveButton.disabled || false}
                    onClick={props.positiveButton.onClick}
                  >
                    {props.positiveButton.text || "OK"}
                  </RebassButton>
                )}

                {props.negativeButton && (
                  <RebassButton
                    variant="secondary"
                    width={"25%"}
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
}

export const showDialog = dialog => {
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
};
