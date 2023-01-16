/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { Flex, Text, Button as RebassButton } from "@theme-ui/components";
import * as Icon from "../icons";
import Modal from "react-modal";
import { useTheme } from "@emotion/react";
import { FlexScrollContainer } from "../scroll-container";

Modal.setAppElement("#root");
function Dialog(props) {
  const theme = useTheme();
  return (
    <Modal
      isOpen={props.isOpen || false}
      onRequestClose={props.onClose}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender
      onAfterOpen={(e) => {
        if (!props.onClose) return;
        // we need this work around because ReactModal content spreads over the overlay
        const child = e.contentEl.firstElementChild;
        e.contentEl.onmousedown = function (e) {
          if (!e.screenX && !e.screenY) return;
          if (
            e.x < child.offsetLeft ||
            e.x > child.offsetLeft + child.clientWidth ||
            e.y < child.offsetTop ||
            e.y > child.offsetTop + child.clientHeight
          ) {
            props.onClose();
          }
        };
        if (props.onOpen) props.onOpen();
      }}
      style={{
        content: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          backgroundColor: undefined,
          padding: 0,
          overflowY: "hidden",
          border: 0,
          zIndex: 0
        },
        overlay: {
          zIndex: 999,
          background: theme.colors.overlay
        }
      }}
    >
      <Flex
        bg="background"
        sx={{
          justifyContent: "stretch",
          position: "relative",
          overflow: "hidden",
          boxShadow: "4px 5px 18px 2px #00000038",
          borderRadius: "dialog",
          flexDirection: "column",
          width: ["100%", "90%", props.width || "380px"],
          height: ["100%", "auto", "auto"],
          maxHeight: ["100%", "80%", "70%"],
          alignSelf: "center",
          overflowY: "hidden"
        }}
      >
        {props.showClose && (
          <Icon.Close
            sx={{
              position: "absolute",
              cursor: "pointer",
              top: 0,
              right: 20,
              mt: 26,
              zIndex: 999
            }}
            size={20}
            onClick={props.onClose}
          />
        )}
        <Flex p={4} pb={0} sx={{ flexDirection: "column" }}>
          <Text
            variant="heading"
            sx={{
              fontSize: "subheading",
              textAlign: props.alignment || "left",
              color: "text"
            }}
          >
            {props.title}
          </Text>
          {props.description && (
            <Text
              variant="body"
              sx={{
                textAlign: props.alignment || "left",
                color: "fontTertiary"
              }}
            >
              {props.description}
            </Text>
          )}
        </Flex>
        <Flex variant="columnFill" sx={{ overflowY: "hidden" }} my={1}>
          {props.noScroll ? (
            props.children
          ) : (
            <FlexScrollContainer style={{ paddingRight: 20, paddingLeft: 20 }}>
              {props.children}
            </FlexScrollContainer>
          )}
        </Flex>
        {(props.positiveButton || props.negativeButton) && (
          <Flex
            sx={{ justifyContent: props.alignment || "flex-end" }}
            bg="bgSecondary"
            p={1}
            px={2}
            mt={2}
          >
            {props.negativeButton && (
              <RebassButton
                variant="dialog"
                data-test-id="dialog-no"
                onClick={props.negativeButton.onClick}
                color="text"
              >
                {props.negativeButton.text || "Cancel"}
              </RebassButton>
            )}
            {props.positiveButton && (
              <RebassButton
                {...props.positiveButton.props}
                variant="dialog"
                data-test-id="dialog-yes"
                autoFocus={props.positiveButton.autoFocus}
                disabled={props.positiveButton.disabled || false}
                onClick={
                  !props.positiveButton.disabled
                    ? props.positiveButton.onClick
                    : undefined
                }
              >
                {props.positiveButton.loading ? (
                  <Icon.Loading size={16} color="primary" />
                ) : (
                  props.positiveButton.text || "OK"
                )}
              </RebassButton>
            )}
          </Flex>
        )}
        {props.footer}
      </Flex>
    </Modal>
  );
}

export default Dialog;
