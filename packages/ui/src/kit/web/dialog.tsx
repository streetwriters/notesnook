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

import { useEffect, useRef, type KeyboardEvent, type RefObject } from "react";
import { useEscape } from "../shared/use-escape";
import type * as Contract from "../contracts/dialog";
import { Close, Loading } from "../shared/icons";
import { Button, Flex, Text } from "./primitives";
import { ScrollContainer } from "./layout";
import { ThemeScope, useThemeContext } from "./theme";

export function DialogButton(props: Contract.DialogButtonProps) {
  const { disabled, onClick, loading, text, variant, testID, sx } = props;
  return (
    <Button
      testID={testID}
      variant={variant ?? "dialog"}
      disabled={disabled}
      onPress={disabled ? undefined : onClick}
      sx={{
        maxWidth: "100%",
        overflow: "hidden",
        px: "spacing8",
        py: "spacing6",
        ...sx
      }}
    >
      {loading ? (
        <Loading
          size={16}
          color={variant === "new_accent" ? "accentForeground" : "paragraph"}
        />
      ) : (
        text
      )}
    </Button>
  );
}

export function Dialog(props: Contract.DialogProps) {
  const { definition } = useThemeContext();
  const isOpen = props.isOpen !== false;
  const onOpen = props.onOpen;
  useEffect(() => {
    if (isOpen) onOpen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  useEscape(props.onClose, isOpen);
  const panel = useRef<HTMLElement | null>(null);
  // Move focus into the dialog on open and give it back on close.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    if (node && !node.contains(document.activeElement)) {
      (
        node.querySelector<HTMLElement>(
          "[autofocus], input, textarea, select, button, [tabindex]"
        ) ?? node
      ).focus({ preventScroll: true });
    }
    return () => previous?.focus?.({ preventScroll: true });
  }, [isOpen]);
  // Keep Tab inside the dialog.
  const trapTab = (event: KeyboardEvent) => {
    if (event.key !== "Tab" || !panel.current) return;
    const focusable = Array.from(
      panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (event.shiftKey && (active === first || active === panel.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  };
  if (!isOpen) return null;

  return (
    <ThemeScope scope="dialog">
      <Flex
        testID={props.testID ? `${props.testID}-backdrop` : "dialog-backdrop"}
        onPress={props.onClose}
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          bg: "backdrop",
          flexDirection: "column",
          justifyContent: "center"
        }}
      >
        <div
          ref={panel as RefObject<HTMLDivElement>}
          role="dialog"
          aria-modal="true"
          aria-label={props.title}
          onKeyDown={trapTab}
          style={{ display: "contents" }}
        >
        <Flex
          testID={props.testID ?? "dialog"}
          onPress={(event) => event.stopPropagation()}
          sx={
            {
              flexDirection: "column",
              width: ["100%", "90%", props.width ?? 480],
              maxHeight: ["100%", "80%", props.height ?? "70%"],
              bg: "background",
              alignSelf: "center",
              overflow: "hidden",
              borderRadius: "radius4",
              boxShadow:
                definition.colorScheme === "dark"
                  ? undefined
                  : "0px 4px 34px 0px rgba(0, 0, 0, 0.1)",
              ...props.sx
            } as never
          }
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
                {props.title ? (
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
                      testID="dialog-title"
                      variant="heading"
                      sx={{
                        fontSize: "lg",
                        fontWeight: 600,
                        lineHeight: "100%",
                        textAlign: props.textAlignment ?? "left",
                        color: "heading"
                      }}
                    >
                      {props.title}
                    </Text>
                    {props.titleAction}
                  </Flex>
                ) : null}
                {props.description ? (
                  <Text
                    variant="body"
                    sx={{
                      textAlign: props.textAlignment ?? "left",
                      color: "paragraph",
                      fontSize: "md",
                      lineHeight: 1.4
                    }}
                  >
                    {props.description}
                  </Text>
                ) : null}
              </Flex>
            ) : null}
            {props.showCloseButton ? (
              <Button
                testID="dialog-close"
                onPress={props.onClose}
                sx={{ bg: "transparent", p: 0, zIndex: 999 }}
              >
                <Close size={16} />
              </Button>
            ) : null}
          </Flex>

          {props.noScroll ? (
            props.children
          ) : (
            <Flex sx={{ flexDirection: "column", flex: 1, overflow: "hidden" }}>
              <ScrollContainer sx={{ flex: 1, px: 20 }}>
                {props.children}
              </ScrollContainer>
            </Flex>
          )}

          {props.positiveButton || props.negativeButton ? (
            <Flex
              sx={{
                flexDirection: "row",
                justifyContent:
                  props.buttonsAlignment === "start"
                    ? "flex-start"
                    : props.buttonsAlignment === "center"
                    ? "center"
                    : "flex-end",
                gap: "spacing4",
                bg: "background-secondary",
                p: 0,
                px: "spacing7",
                py: "spacing4"
              }}
            >
              {props.negativeButton ? (
                <DialogButton
                  {...props.negativeButton}
                  testID="dialog-no"
                  role="negative-button"
                  variant={props.negativeButton.variant ?? "new_tertiary"}
                />
              ) : null}
              {props.positiveButton ? (
                <DialogButton
                  {...props.positiveButton}
                  testID="dialog-yes"
                  role="positive-button"
                  variant={props.positiveButton.variant ?? "new_accent"}
                />
              ) : null}
            </Flex>
          ) : null}
          {props.footer}
        </Flex>
        </div>
      </Flex>
    </ThemeScope>
  );
}
