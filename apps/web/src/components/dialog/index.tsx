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

import { Button, ButtonProps, Flex, Text, Box } from "@theme-ui/components";
import { SxProp } from "@theme-ui/core";
import React from "react";
import ReactModal from "react-modal";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { Close, Loading } from "../icons";
import { FlexScrollContainer } from "../scroll-container";
import { ScopedThemeProvider } from "../theme-provider";

ReactModal.setAppElement("#root");

type DialogButtonProps = ButtonProps & {
  onClick?: () => void;
  disabled?: boolean;
  text: JSX.Element | string;
  loading?: boolean;
  role?: string;
  variant?: string;
};

type DialogProps = SxProp & {
  testId?: string;
  isOpen?: boolean;
  onClose?: (
    event?: React.MouseEvent<Element, MouseEvent> | React.KeyboardEvent<Element>
  ) => void;
  onOpen?: () => void;
  width?: number | string;
  height?: number | string;
  showCloseButton?: boolean;
  textAlignment?: "left" | "right" | "center";
  buttonsAlignment?: "start" | "center" | "end";
  title?: string;
  titleAction?: React.ReactNode;
  description?: string;
  positiveButton?: DialogButtonProps | null;
  negativeButton?: DialogButtonProps | null;
  footer?: React.ReactNode;
  noScroll?: boolean;
};

function BaseDialog(props: React.PropsWithChildren<DialogProps>) {
  const theme = useThemeStore((store) => store.colorScheme);

  return (
    <ReactModal
      isOpen={props.isOpen || false}
      onRequestClose={props.onClose}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender
      onAfterOpen={(e) => onAfterOpen(e, props)}
      overlayClassName={"theme-scope-dialog"}
      data={{
        "test-id": props.testId
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
          // backgroundColor: undefined,
          padding: 0,
          overflowY: "hidden",
          border: 0,
          zIndex: 999,
          backgroundColor: "var(--backdrop)"
        },
        overlay: {
          opacity: 1
        }
      }}
    >
      <ScopedThemeProvider
        scope="dialog"
        injectCssVars
        sx={{
          display: "flex",
          flexDirection: "column",
          width: ["100%", "90%", props.width || "480px"],
          maxHeight: ["100%", "80%", props.height || "70%"],
          height: ["100%", "auto", "auto"],
          bg: "background",
          alignSelf: "center",
          overflowY: "hidden",

          justifyContent: "stretch",
          position: "relative",
          overflow: "hidden",
          boxShadow: `0px 4px 34px 0 ${
            theme === "dark" ? "000000aa" : "rgba(0, 0, 0, 0.1)"
          }`,
          borderRadius: "radius4",

          ...props.sx
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            props.onClose?.();
          }
        }}
      >
        <Flex
          sx={{
            flexDirection: "row",
            padding: "spacing7",
            pb: 0,
            gap: "spacing3"
          }}
        >
          {props.title || props.description ? (
            <Flex sx={{ flexDirection: "column", gap: "spacing4" }}>
              {props.title && (
                <Flex
                  sx={{
                    alignItems: "center",
                    justifyContent:
                      props.textAlignment === "center"
                        ? "center"
                        : "space-between"
                  }}
                >
                  <Text
                    variant="heading"
                    data-test-id="dialog-title"
                    sx={{
                      fontSize: "lg",
                      fontWeight: 600,
                      lineHeight: "100%",
                      textAlign: props.textAlignment || "left",
                      color: "heading",
                      overflowWrap: "anywhere",
                      wordSpacing: "wrap"
                    }}
                  >
                    {props.title}
                  </Text>
                  {props.titleAction}
                </Flex>
              )}
              {props.description && (
                <Text
                  variant="body"
                  sx={{
                    textAlign: props.textAlignment || "left",
                    color: "paragraph",
                    fontSize: "md",
                    lineHeight: 1.4,
                    overflowWrap: "anywhere",
                    wordSpacing: "wrap"
                  }}
                >
                  {props.description}
                </Text>
              )}
            </Flex>
          ) : null}
          {props.showCloseButton && (
            <Close
              sx={{
                cursor: "pointer",
                zIndex: 999
              }}
              size={16}
              onClick={props.onClose}
            />
          )}
        </Flex>

        {props.noScroll ? (
          <>{props.children}</>
        ) : (
          <Flex variant="columnFill" sx={{ overflowY: "hidden" }}>
            <FlexScrollContainer style={{ paddingRight: 20, paddingLeft: 20 }}>
              {props.children}
            </FlexScrollContainer>
          </Flex>
        )}

        {(props.positiveButton || props.negativeButton) && (
          <Flex
            sx={{
              justifyContent: props.buttonsAlignment || "end",
              gap: "spacing4"
            }}
            bg="background-secondary"
            p={0}
            px="spacing7"
            py="spacing4"
          >
            {props.negativeButton && (
              <DialogButton
                {...props.negativeButton}
                variant={props.negativeButton.variant || "new_tertiary"}
                data-test-id="dialog-no"
                role="negative-button"
              />
            )}
            {props.positiveButton && (
              <DialogButton
                {...props.positiveButton}
                variant={props.positiveButton.variant || "new_accent"}
                data-test-id="dialog-yes"
                role="positive-button"
              />
            )}
          </Flex>
        )}
        {props.footer}
      </ScopedThemeProvider>
    </ReactModal>
  );
}

export default BaseDialog;

export function DialogButton({
  disabled,
  onClick,
  loading,
  text,
  role,
  ...props
}: DialogButtonProps) {
  return (
    <Button
      {...props}
      variant={props.variant || "dialog"}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      data-role={role}
      sx={{
        maxWidth: "100%",
        textOverflow: "ellipsis",
        overflow: "hidden",
        whiteSpace: "nowrap",
        px: "spacing8",
        py: "spacing6"
      }}
    >
      {loading ? <Loading size={16} color="accent" /> : text}
    </Button>
  );
}

function onAfterOpen(
  e: ReactModal.OnAfterOpenCallbackOptions | undefined,
  props: DialogProps
) {
  if (props.onOpen) props.onOpen();
  if (!props.onClose || !e) return;
  // we need this work around because ReactModal content spreads over the overlay
  const child = e.contentEl.firstElementChild as HTMLElement;
  if (!child) return;

  e.contentEl.onmousedown = function (e) {
    if (!e.screenX && !e.screenY) return;
    if (
      e.x < child.offsetLeft ||
      e.x > child.offsetLeft + child.clientWidth ||
      e.y < child.offsetTop ||
      e.y > child.offsetTop + child.clientHeight
    ) {
      if (props.onClose) props.onClose();
    }
  };
}
