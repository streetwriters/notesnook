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

import { useRef, useState } from "react";
import { Checkbox, Flex, Text } from "@ui";
import { Dialog } from "@ui";
import { Field, type FieldProps } from "./components/field";
import { Warning } from "../components/icons";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { MarkdownText } from "./components/markdown-text";

type Check = { text: string; default?: boolean };
export type PasswordDialogProps<
  TInputId extends string,
  TCheckId extends string
> = BaseDialogProps<boolean | Record<TCheckId, boolean>> & {
  title: string;
  subtitle?: string;
  message?: string;
  inputs: Record<TInputId, FieldProps>;
  validate: (passwords: Record<TInputId, string>) => Promise<boolean>;
  checks?: Record<TCheckId, Check>;
};
const PasswordDialog = DialogManager.register(function PasswordDialog<
  TInputId extends string,
  TCheckId extends string
>(props: PasswordDialogProps<TInputId, TCheckId>) {
  const { checks, inputs, message, validate, onClose } = props;
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const values = useRef<Record<string, string>>({});
  const checked = useRef<Record<string, boolean>>(
    Object.fromEntries(
      Object.entries<Check>((checks || {}) as Record<string, Check>).map(
        ([id, check]) => [id, !!check.default]
      )
    )
  );

  const onSubmit = async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const passwords = Object.fromEntries(
        Object.keys(inputs).map((id) => {
          const inputData = values.current[id];
          if (!inputData) throw new Error(`${id} is required.`);
          return [id, inputData];
        })
      ) as Record<TInputId, string>;

      if (await validate(passwords)) {
        onClose(
          checks
            ? (Object.fromEntries(
                Object.keys(checks).map((id) => [id, !!checked.current[id]])
              ) as Record<TCheckId, boolean>)
            : true
        );
      } else {
        setError(strings.passwordIncorrect());
        setIsLoading(false);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      testID="password-dialog"
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      onClose={() => onClose(false)}
      positiveButton={{
        text: strings.submit(),
        onClick: onSubmit,
        loading: isLoading,
        disabled: isLoading
      }}
      negativeButton={{ text: strings.cancel(), onClick: () => onClose(false) }}
    >
      <Flex sx={{ mb: "spacing7", flexDirection: "column" }}>
        {message ? <MarkdownText text={message} /> : null}
        {Object.entries<FieldProps>(inputs).map(([id, input], index) => (
          <Field
            autoFocus={index === 0}
            sx={{ mt: "spacing6" }}
            {...input}
            key={id}
            id={id}
            testID={id}
            required
            type="password"
            placeholder={strings.enterYourPassword()}
            variant={error ? "error" : input.variant}
            onChangeText={(text) => {
              values.current[id] = text;
              input.onChangeText?.(text);
            }}
            onSubmit={() => onSubmit()}
          />
        ))}

        {checks
          ? Object.entries<Check>(checks).map(([id, check]) => (
              <Flex
                key={id}
                sx={{
                  mt: 2,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "small"
                }}
              >
                <Checkbox
                  testID={id}
                  defaultChecked={check.default}
                  sx={{ width: 18, height: 18 }}
                  onChange={(value) => (checked.current[id] = value)}
                />
                <Text variant="body" sx={{ color: "paragraph" }}>
                  {check.text}
                </Text>
              </Flex>
            ))
          : null}

        {error && (
          <Flex
            sx={{
              alignItems: "center",
              flexDirection: "row",
              gap: "spacing3",
              mt: "spacing4"
            }}
          >
            <Warning size={13} color="icon-error" />
            <Text
              sx={{
                fontSize: "xs",
                fontWeight: 400,
                color: "paragraph-error"
              }}
            >
              {error}
            </Text>
          </Flex>
        )}
      </Flex>
    </Dialog>
  );
});

export function showPasswordDialog<
  TInputId extends string,
  TCheckId extends string
>(props: Omit<PasswordDialogProps<TInputId, TCheckId>, "onClose">) {
  return PasswordDialog.show(props) as Promise<
    string extends TCheckId ? boolean : false | Record<TCheckId, boolean>
  >;
}
