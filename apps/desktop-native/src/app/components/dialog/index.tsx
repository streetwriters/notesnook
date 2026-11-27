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

import {
  Button,
  Flex,
  Modal,
  ScrollContainer,
  Text,
  type ButtonProps,
  type Length,
  type SxProp
} from "@notesnook/ui-kit";
import React from "react";
import { useStore as useThemeStore } from "../../stores/theme-store";
import { Close, Loading } from "../icons";

Modal.setAppElement("#root");

export type DialogButtonProps = Omit<
  ButtonProps,
  "onClick" | "role" | "variant"
> & {
  onClick?: () => void;
  disabled?: boolean;
  text: React.ReactElement | string;
  loading?: boolean;
  role?: string;
  /** A theme button variant; a string, as on web. */
  variant?: string;
};

export type DialogProps = {
  sx?: SxProp;
  testId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  width?: Length;
  height?: Length;
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

const JUSTIFY = {
  start: "flex-start",
  center: "center",
  end: "flex-end"
} as const;

// apps/web lets react-modal's content cover the window and closes the dialog
// on a mousedown outside its first child. The desktop Modal has no DOM to
// measure, so the backdrop is a pressable layer around the dialog instead;
// its test ids (`<testId>-backdrop`, `<testId>`) are the ones e2e specs use.
function BaseDialog(props: React.PropsWithChildren<DialogProps>) {
  const theme = useThemeStore((store) => store.colorScheme);

  return (
    <Modal
      isOpen={props.isOpen ?? true}
      onRequestClose={() => props.onClose?.()}
      shouldCloseOnEsc
      shouldReturnFocusAfterClose
      shouldFocusAfterRender={false}
      onAfterOpen={() => props.onOpen?.()}
      overlayClassName={"theme-scope-dialog"}
      style={{
        content: {
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          // As apps/web: the content is the flex column the backdrop and the
          // dialog's percentage max-height resolve against.
          display: "flex",
          flexDirection: "column",
          overflowY: "hidden",
          padding: 0,
          borderWidth: 0,
          borderRadius: 0,
          backgroundColor: "transparent"
        },
        overlay: {
          opacity: 1,
          backgroundColor: "transparent"
        }
      }}
    >
      <Flex
        data-test-id={
          props.testId ? `${props.testId}-backdrop` : "dialog-backdrop"
        }
        onClick={() => props.onClose?.()}
        sx={{
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
          bg: "backdrop",
          cursor: "default"
        }}
      >
        <Flex
          data-test-id={props.testId ?? "dialog"}
          onClick={(e) => e.stopPropagation()}
          sx={{
            display: "flex",
            flexDirection: "column",
            width: ["100%", "90%", props.width || 480],
            maxHeight: ["100%", "80%", props.height || "70%"],
            bg: "background",
            alignSelf: "center",
            position: "relative",
            overflow: "hidden",
            cursor: "default",
            // The kit types `boxShadow` as a theme token; this is the shadow
            // apps/web's dialog draws.
            boxShadow: (theme === "dark"
              ? undefined
              : "0px 4px 34px 0px rgba(0, 0, 0, 0.1)") as never,
            borderRadius: "radius4",

            ...props.sx
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
              <Flex sx={{ flexDirection: "column", gap: "spacing4", flex: 1 }}>
                {props.title && (
                  <Flex
                    sx={{
                      flexDirection: "row",
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
                        color: "heading"
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
                      lineHeight: 1.4
                    }}
                  >
                    {props.description}
                  </Text>
                )}
              </Flex>
            ) : null}
            {props.showCloseButton && (
              <Button
                data-test-id="dialog-close"
                onClick={() => props.onClose?.()}
                sx={{ bg: "transparent", p: 0, zIndex: 999 }}
              >
                <Close size={16} />
              </Button>
            )}
          </Flex>

          {props.noScroll ? (
            <>{props.children}</>
          ) : (
            <Flex sx={{ flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <ScrollContainer sx={{ flex: 1, px: 20 }}>
                {props.children}
              </ScrollContainer>
            </Flex>
          )}

          {(props.positiveButton || props.negativeButton) && (
            <Flex
              sx={{
                flexDirection: "row",
                justifyContent: JUSTIFY[props.buttonsAlignment || "end"],
                gap: "spacing4",
                bg: "background-secondary",
                p: 0,
                px: "spacing7",
                py: "spacing4"
              }}
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
        </Flex>
      </Flex>
    </Modal>
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
      variant={(props.variant || "dialog") as ButtonProps["variant"]}
      disabled={disabled}
      onClick={disabled ? undefined : () => onClick?.()}
      data-role={role}
      sx={{
        maxWidth: "100%",
        overflow: "hidden",
        px: "spacing8",
        py: "spacing6",
        ...props.sx
      }}
    >
      {loading ? (
        <Loading
          size={16}
          color={
            props.variant === "new_accent" ? "accentForeground" : "paragraph"
          }
        />
      ) : (
        text
      )}
    </Button>
  );
}
