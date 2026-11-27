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

import { forwardRef, useState, type ReactNode } from "react";
import {
  Button,
  Flex,
  Input,
  Text,
  Textarea,
  type InputProps,
  type SxProp,
  type TextareaProps,
  type UIChangeEvent,
  type UIInputElement
} from "@notesnook/ui-kit";
import {
  PasswordInvisible,
  PasswordVisible,
  type Icon
} from "../../components/icons";
import { AuthErrorText } from "./error-text";

export type FieldAction = {
  id?: string;
  testId?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: Icon;
  component?: ReactNode;
  hidden?: boolean;
  sx?: SxProp;
};

export type FieldProps = Omit<InputProps, "sx"> & {
  sx?: SxProp;
  as?: "input" | "textarea";
  rows?: number;
  label?: string;
  helpText?: string;
  error?: string;
  validate?: (text: string) => boolean;
  styles?: { input?: SxProp; label?: SxProp; helpText?: SxProp };
  action?: FieldAction;
  rightActions?: FieldAction[];
  leftActions?: FieldAction[];
  leftIcon?: Icon;
  rightIcon?: Icon;
  required?: boolean;
  autoComplete?: string;
  name?: string;
};

const inputBase: SxProp = {
  fontSize: "sm",
  px: "spacing4",
  py: "spacing6"
};

function ActionButtons(props: {
  actions: FieldAction[];
  side: "left" | "right";
}) {
  if (!props.actions.length) return null;
  return (
    <Flex
      sx={{
        position: "absolute",
        top: 0,
        [props.side]: 0,
        height: "100%",
        flexDirection: "row",
        overflow: "hidden",
        borderRadius: "radius2"
      }}
    >
      {props.actions.map((action, index) => (
        <Button
          key={action.testId || action.id || index}
          data-test-id={action.testId}
          variant="secondary"
          disabled={action.disabled}
          onClick={() => action.onClick?.()}
          sx={{
            p: 0,
            px: 1,
            height: "100%",
            borderRadius: 0,
            m: 0,
            alignItems: "center",
            justifyContent: "center",
            ...action.sx
          }}
        >
          {action.component ? (
            action.component
          ) : action.icon ? (
            <action.icon size={props.side === "left" ? 20 : 15} />
          ) : null}
        </Button>
      ))}
    </Flex>
  );
}

export const Field = forwardRef<UIInputElement, FieldProps>(function Field(
  props,
  ref
) {
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
    as,
    rows,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    required: _required,
    autoComplete: _autoComplete,
    name: _name,
    rightActions: rightActionsProp,
    leftActions: leftActionsProp,
    onChange: onChangeProp,
    variant,
    ...inputProps
  } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const rightActions = rightActionsProp
    ? rightActionsProp.filter((a) => !a.hidden)
    : action && !action.hidden
    ? [action]
    : [];
  const leftActions = leftActionsProp
    ? leftActionsProp.filter((a) => !a.hidden)
    : [];
  const resolvedVariant = isValid && !error ? variant || "input" : "error";
  const inputSx: SxProp = {
    flex: 1,
    ...inputBase,
    pr: rightActions.length > 0 || type === "password" ? 20 : undefined,
    pl: leftActions.length > 0 || LeftIcon ? 30 : undefined,
    ...styles?.input
  };
  const onChange = (e: UIChangeEvent<UIInputElement>) => {
    const valid = !validate || validate(e.target.value);
    setIsValid(valid);
    if (valid) onChangeProp?.(e);
  };

  return (
    <Flex
      sx={{
        opacity: disabled ? 0.7 : 1,
        gap: "spacing4",
        flexDirection: "column",
        ...sx
      }}
    >
      {label ? (
        <Flex sx={{ flexDirection: "column" }}>
          <Text
            sx={{
              fontSize: "xs",
              color: "paragraph-secondary",
              lineHeight: 1.2,
              ...styles?.label
            }}
          >
            {label}
          </Text>
          {helpText ? (
            <Text
              variant="subBody"
              sx={{ fontWeight: "normal", ...styles?.helpText }}
            >
              {helpText}
            </Text>
          ) : null}
        </Flex>
      ) : null}
      <Flex sx={{ position: "relative", flex: 1, flexDirection: "row" }}>
        {as === "textarea" ? (
          <Textarea
            {...(inputProps as unknown as TextareaProps)}
            ref={ref}
            rows={rows}
            variant={resolvedVariant}
            disabled={disabled}
            onChange={onChange as TextareaProps["onChange"]}
            sx={inputSx}
          />
        ) : (
          <Input
            {...inputProps}
            ref={ref}
            variant={resolvedVariant}
            disabled={disabled}
            type={
              type === "password" && isPasswordVisible ? "text" : type || "text"
            }
            onChange={onChange}
            sx={inputSx}
          />
        )}
        {LeftIcon ? (
          <Flex
            sx={{
              position: "absolute",
              left: 8,
              top: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}
          >
            <LeftIcon size={15} color="icon" />
          </Flex>
        ) : null}
        {RightIcon ? (
          <Flex
            sx={{
              position: "absolute",
              right: 8,
              top: 0,
              bottom: 0,
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none"
            }}
          >
            <RightIcon size={15} color="icon" />
          </Flex>
        ) : null}
        {type === "password" ? (
          <Flex
            onClick={() => setIsPasswordVisible((s) => !s)}
            sx={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              px: 2,
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              borderTopRightRadius: "radius2",
              borderBottomRightRadius: "radius2",
              ":hover": { bg: "border" }
            }}
          >
            {isPasswordVisible ? (
              <PasswordVisible size={15} />
            ) : (
              <PasswordInvisible size={15} />
            )}
          </Flex>
        ) : null}
        <ActionButtons actions={leftActions} side="left" />
        <ActionButtons actions={rightActions} side="right" />
      </Flex>
      <AuthErrorText error={error} />
    </Flex>
  );
});

export default Field;
