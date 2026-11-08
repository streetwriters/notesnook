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

import { useEffect } from "react";
import { useEscape } from "../../../app/hooks/use-escape";
import { View } from "react-native";
import type * as Contract from "../../../ui/dialog";
import { Close, Loading } from "../../../app/components/icons";
import { Button, Flex, Text } from "./primitives";
import { ScrollContainer } from "./layout";
import { ThemeScope, useThemeContext } from "./theme";
import { useStyled } from "./style/use-styled";

const AnyView = View as any;

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
        <AnyView
          testID={props.testID ?? "dialog"}
          onPress={(event: { stopPropagation?: () => void }) =>
            event.stopPropagation?.()
          }
          style={{
            ...viewStyle,
            boxShadow: `0px 4px 34px 0px ${
              definition.colorScheme === "dark"
                ? "#000000aa"
                : "rgba(0, 0, 0, 0.1)"
            }`
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
        </AnyView>
      </Flex>
    </ThemeScope>
  );
}
