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

import { useState } from "react";
import { Button, Flex, Text, InputProps } from "@theme-ui/components";
import { Input, Label } from "@theme-ui/components";
import { ThemeUIStyleObject } from "@theme-ui/css";
import { PasswordVisible, PasswordInvisible, Icon } from "../icons";
import { useStore as useThemeStore } from "../../stores/theme-store";

type Action = {
  testId?: string;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  icon?: Icon;
  component?: JSX.Element;
};
export type FieldProps = InputProps & {
  label?: string;
  helpText?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  ["data-test-id"]?: string;
  validate?: (text: string) => boolean;
  styles?: {
    input?: ThemeUIStyleObject;
    label?: ThemeUIStyleObject;
    helpText?: ThemeUIStyleObject;
  };
  action?: Action;
  rightActions?: Action[];
  leftActions?: Action[];
};

function Field(props: FieldProps) {
  const {
    label,
    styles,
    helpText,
    action,
    sx,
    id,
    type,
    inputRef,
    validate,
    disabled,
    ...inputProps
  } = props;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const [isValid, setIsValid] = useState(true);
  const rightActions = props.rightActions || (action ? [action] : []);
  const leftActions = props.leftActions || [];

  return (
    <Flex
      sx={{
        m: "2px",
        mr: "2px",
        opacity: disabled ? 0.7 : 1,
        gap: 1,
        ...sx,
        flexDirection: "column"
      }}
    >
      <Label
        htmlFor={id}
        sx={{
          fontSize: "subtitle",
          fontWeight: "bold",
          fontFamily: "body",
          color: "paragraph",
          flexDirection: "column",
          ...styles?.label
        }}
      >
        {label}{" "}
        {helpText && (
          <Text
            variant="subBody"
            as="span"
            sx={{
              fontWeight: "normal",
              ...styles?.helpText
            }}
          >
            {helpText}
          </Text>
        )}
      </Label>

      <Flex sx={{ position: "relative", flex: 1 }}>
        <Input
          {...inputProps}
          variant={isValid ? inputProps.variant || "input" : "error"}
          ref={inputRef}
          id={id}
          type={isPasswordVisible ? "text" : type || "text"}
          sx={{
            flex: 1,
            ...styles?.input,
            pointerEvents: disabled ? "none" : "all",
            ":disabled": {
              bg: "background-disabled"
            },
            colorScheme
          }}
          onChange={(e) => {
            const isValid = !validate || validate(e.target.value);
            setIsValid(isValid);
            if (isValid && inputProps.onChange) inputProps.onChange(e);
          }}
        />
        {type === "password" && (
          <Flex
            onClick={() => setIsPasswordVisible((s) => !s)}
            variant="rowCenter"
            sx={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              px: 2,
              cursor: "pointer",
              borderTopRightRadius: "default",
              borderBottomRightRadius: "default",
              ":hover": { bg: "border" }
            }}
          >
            {isPasswordVisible ? <PasswordVisible /> : <PasswordInvisible />}
          </Flex>
        )}

        {rightActions.length > 0 ? (
          <Flex
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              borderTopLeftRadius: "default",
              borderBottomLeftRadius: "default",
              overflow: "hidden"
            }}
          >
            {leftActions.map((action) => (
              <Button
                key={action.testId}
                type="button"
                variant={"secondary"}
                data-test-id={action.testId}
                onClick={action.onClick}
                sx={{
                  p: 0,
                  px: 1,
                  height: "100%",
                  bg: "transparent",
                  borderRadius: 0,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                disabled={action.disabled}
              >
                {action.component ? (
                  action.component
                ) : action.icon ? (
                  <action.icon size={20} />
                ) : null}
              </Button>
            ))}
          </Flex>
        ) : null}
        {rightActions.length > 0 ? (
          <Flex
            sx={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              borderTopRightRadius: "default",
              borderBottomRightRadius: "default",
              overflow: "hidden"
            }}
          >
            {rightActions.map((action) => (
              <Button
                key={action.testId}
                type="button"
                variant={"secondary"}
                data-test-id={action.testId}
                onClick={action.onClick}
                sx={{
                  p: 0,
                  px: 1,
                  height: "100%",
                  bg: "transparent",
                  borderRadius: 0,
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                disabled={action.disabled}
              >
                {action.component ? (
                  action.component
                ) : action.icon ? (
                  <action.icon size={20} />
                ) : null}
              </Button>
            ))}
          </Flex>
        ) : null}
      </Flex>
    </Flex>
  );
}

export default Field;
