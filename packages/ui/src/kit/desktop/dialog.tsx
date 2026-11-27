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

import { useEffect, useRef } from "react";
import { useEscape } from "../shared/use-escape";
import { Pressable } from "react-native";
import type * as Contract from "../contracts/dialog";
import type { UIElement } from "../contracts/elements";
import type { ThemeScopeName } from "../contracts/style";
import { Close, Loading } from "../shared/icons";
import { Button, Flex, Text } from "./primitives";
import { ScrollContainer } from "./layout";
import { ThemeScope, useThemeContext } from "./theme";
import { useStyled } from "./style/use-styled";

const AnyPressable = Pressable as any;

/** The theme scope a `theme-scope-<name>` class asks for, as on the web. */
export function scopeOfClassName(
  ...classNames: (string | undefined)[]
): string | undefined {
  for (const className of classNames) {
    const match = className?.match(/(?:^|\s)theme-scope-([\w-]+)/);
    if (match) return match[1];
  }
  return undefined;
}

function escapeEvent(element: UIElement | null) {
  const native = {
    key: "Escape",
    code: "Escape",
    repeat: false,
    shiftKey: false,
    ctrlKey: false,
    altKey: false,
    metaKey: false,
    preventDefault: () => {},
    stopPropagation: () => {}
  };
  return {
    ...native,
    target: element ?? {},
    currentTarget: element,
    nativeEvent: native
  } as never;
}

function ModalContent(props: Contract.ModalProps) {
  const {
    shouldCloseOnEsc = true,
    shouldCloseOnOverlayClick = true,
    shouldFocusAfterRender = true,
    onRequestClose
  } = props;
  const content = useRef<UIElement>(null);
  const callbacks = useRef(props);
  callbacks.current = props;

  useEffect(() => {
    if (shouldFocusAfterRender) content.current?.focus?.();
    callbacks.current.onAfterOpen?.();
    return () => callbacks.current.onAfterClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEscape(
    onRequestClose
      ? () => onRequestClose(escapeEvent(content.current))
      : undefined,
    shouldCloseOnEsc
  );

  const scope = scopeOfClassName(props.overlayClassName, props.className);
  const testId = props.data?.["test-id"] ?? props.testId;
  const modal = (
    <Flex
      id={props.id}
      testID={testId ? `${testId}-overlay` : "modal-overlay"}
      onPress={
        shouldCloseOnOverlayClick && onRequestClose
          ? (event) => onRequestClose(event as never)
          : undefined
      }
      // react-modal's defaults, then the caller's.
      sx={
        {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999,
          bg: "backdrop",
          ...props.style?.overlay
        } as never
      }
    >
      <Flex
        ref={content}
        testID={testId ?? "modal-content"}
        aria-label={props.contentLabel}
        onPress={(event) => event.stopPropagation()}
        sx={
          {
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            flexDirection: "column",
            bg: "background",
            border: "1px solid",
            borderColor: "border",
            borderRadius: 4,
            padding: 20,
            overflow: "hidden",
            ...props.style?.content
          } as never
        }
      >
        {props.children}
      </Flex>
    </Flex>
  );
  return scope ? (
    <ThemeScope scope={scope as ThemeScopeName}>{modal}</ThemeScope>
  ) : (
    modal
  );
}

/**
 * react-modal's `Modal`: its children show only while `isOpen`, over an
 * overlay that covers the window, and `onRequestClose` is called on Escape and
 * on a click on the overlay. It is drawn where it is rendered (there is no
 * portal), so render it at the root of the window as dialogs are.
 */
export const Modal: typeof Contract.Modal = Object.assign(
  function Modal(props: Contract.ModalProps) {
    if (!props.isOpen) return null;
    return <ModalContent {...props} />;
  },
  {
    // The web hides the app element from screen readers; nothing to do here.
    setAppElement: () => {}
  }
);

/** @deprecated Build dialog buttons with `Button`, as apps/web's dialog does. */
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

/** @deprecated Use `Modal`. */
export function Dialog(props: Contract.DialogProps) {
  const { definition } = useThemeContext();
  const { viewStyle } = useStyled({
    sx: {
      flexDirection: "column",
      width: ["100%", "90%", props.width ?? 480],
      maxHeight: ["100%", "80%", props.height ?? "70%"],
      bg: "background",
      alignSelf: "center",
      overflow: "hidden",
      borderRadius: "radius4",
      ...props.sx
    } as never
  });
  const isOpen = props.isOpen !== false;
  const onOpen = props.onOpen;
  useEffect(() => {
    if (isOpen) onOpen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  useEscape(props.onClose, isOpen);
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
        <AnyPressable
          testID={props.testID ?? "dialog"}
          focusable={false}
          onPress={(event: { stopPropagation?: () => void }) =>
            event.stopPropagation?.()
          }
          style={{
            ...viewStyle,
            boxShadow:
              definition.colorScheme === "dark"
                ? undefined
                : "0px 4px 34px 0px rgba(0, 0, 0, 0.1)"
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
        </AnyPressable>
      </Flex>
    </ThemeScope>
  );
}
