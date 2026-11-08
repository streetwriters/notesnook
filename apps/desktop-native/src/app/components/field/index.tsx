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

import { forwardRef, useState, type ReactElement } from "react";
import {
  Button,
  Flex,
  Input,
  Label,
  Text,
  type InputProps,
  type PressEvent,
  type SxProp,
  type UIElement
} from "@ui";
import { PasswordInvisible, PasswordVisible, type Icon } from "../icons";
import { AuthErrorText } from "../error-text";

type Action = {
  id?: string;
  testId?: string;
  onClick?: (event: PressEvent) => void;
  disabled?: boolean;
  icon?: Icon;
  component?: ReactElement;
  hidden?: boolean;
  sx?: SxProp;
};

export type FieldProps = Omit<InputProps, "onChange"> & {
  label?: string;
  helpText?: string;
  error?: string;
  validate?: (text: string) => boolean;
  onChange?: (text: string) => void;
  styles?: {
    input?: SxProp;
    label?: SxProp;
    helpText?: SxProp;
  };
  action?: Action;
  rightActions?: Action[];
  leftActions?: Action[];
  leftIcon?: Icon;
  rightIcon?: Icon;
};

function ActionButtons(props: {
  actions: Action[];
  side: "left" | "right";
  iconSize: number;
}) {
  const { actions, side, iconSize } = props;
  if (actions.length === 0) return null;
  return (
    <Flex
      sx={{
        flexDirection: "row",
        position: "absolute",
        top: 0,
        [side]: 0,
        height: "100%",
        ...(side === "left"
          ? {
              borderTopLeftRadius: "radius2",
              borderBottomLeftRadius: "radius2"
            }
          : {
              borderTopRightRadius: "radius2",
              borderBottomRightRadius: "radius2"
            }),
        overflow: "hidden"
      }}
    >
      {actions.map((action, index) => (
        <Button
          id={action.id}
          key={action.testId || action.id || index}
          variant="secondary"
          testID={action.testId}
          onPress={action.onClick}
          disabled={action.disabled}
          sx={{
            p: 0,
            px: 1,
            height: "100%",
            borderRadius: 0,
            margin: 0,
            alignItems: "center",
            justifyContent: "center",
            ...action.sx
          }}
        >
          {action.component ? (
            action.component
          ) : action.icon ? (
            <action.icon size={iconSize} color="icon" />
          ) : null}
        </Button>
      ))}
    </Flex>
  );
}

function InlineIcon(props: { icon: Icon; side: "left" | "right" }) {
  return (
    <Flex
      sx={{
        position: "absolute",
        top: 0,
        bottom: 0,
        [props.side]: "spacing4",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 1
      }}
    >
      <props.icon size={15} color="icon" />
    </Flex>
  );
}

const Field = forwardRef<UIElement, FieldProps>(function Field(props, ref) {
  const {
    label,
    styles,
    helpText,
    error,
    action,
    sx,
    type,
    validate,
    disabled,
    leftIcon,
    rightIcon,
    onChange,
    ...inputProps
  } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const rightActions = props.rightActions
    ? props.rightActions.filter((a) => !a.hidden)
    : action && !action.hidden
    ? [action]
    : [];
  const leftActions = props.leftActions
    ? props.leftActions.filter((a) => !a.hidden)
    : [];

  return (
    <Flex
      sx={{
        opacity: disabled ? 0.7 : 1,
        gap: "spacing4",
        ...sx,
        flexDirection: "column"
      }}
    >
      {label ? (
        <Label
          sx={{
            fontFamily: "body",
            flexDirection: "column",
            fontSize: "xs",
            color: "paragraph-secondary",
            lineHeight: 1.2,
            ...styles?.label
          }}
        >
          <Text
            sx={{
              fontSize: "xs",
              color: "paragraph-secondary",
              ...styles?.label
            }}
          >
            {label}
            {helpText ? " " : ""}
            {helpText ? (
              <Text
                variant="subBody"
                sx={{ fontWeight: "normal", ...styles?.helpText }}
              >
                {helpText}
              </Text>
            ) : null}
          </Text>
        </Label>
      ) : null}

      <Flex sx={{ position: "relative", flex: 1 }}>
        <Input
          {...inputProps}
          ref={ref}
          disabled={disabled}
          variant={isValid && !error ? inputProps.variant || "input" : "error"}
          type={isPasswordVisible ? "text" : type || "text"}
          sx={{
            flex: 1,
            pr: rightActions.length > 0 ? 20 : undefined,
            ...styles?.input,
            pointerEvents: disabled ? "none" : "auto"
          }}
          onChangeText={(text) => {
            const valid = !validate || validate(text);
            setIsValid(valid);
            if (valid) {
              onChange?.(text);
              inputProps.onChangeText?.(text);
            }
          }}
        />
        {leftIcon ? <InlineIcon icon={leftIcon} side="left" /> : null}
        {rightIcon ? <InlineIcon icon={rightIcon} side="right" /> : null}
        {type === "password" ? (
          <Flex
            onPress={() => setIsPasswordVisible((s) => !s)}
            sx={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              px: 2,
              cursor: "pointer",
              borderTopRightRadius: "radius2",
              borderBottomRightRadius: "radius2",
              ":hover": { bg: "border" }
            }}
          >
            {isPasswordVisible ? (
              <PasswordVisible size={15} color="icon" />
            ) : (
              <PasswordInvisible size={15} color="icon" />
            )}
          </Flex>
        ) : null}
        <ActionButtons actions={leftActions} side="left" iconSize={20} />
        <ActionButtons actions={rightActions} side="right" iconSize={15} />
      </Flex>
      <AuthErrorText error={error} />
    </Flex>
  );
});

export default Field;
