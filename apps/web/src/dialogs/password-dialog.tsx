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
import { Box, Text } from "@theme-ui/components";
import Dialog from "../components/dialog";
import Field, { FieldProps } from "../components/field";
import { Checkbox, Label } from "@theme-ui/components";
import { mdToHtml } from "../utils/md";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

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

  return (
    <Dialog
      testId="password-dialog"
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      onClose={() => onClose(false)}
      positiveButton={{
        form: "passwordForm",
        type: "submit",
        text: strings.submit(),
        loading: isLoading,
        disabled: isLoading
      }}
      negativeButton={{ text: strings.cancel(), onClick: () => onClose(false) }}
    >
      <Box
        id="passwordForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();

          setIsLoading(true);
          setError(undefined);
          try {
            const formData = new FormData(e.target as HTMLFormElement);
            const passwords = Object.fromEntries(
              Object.keys(inputs).map((id) => {
                const inputData = formData.get(id);
                if (!inputData) throw new Error(`${id} is required.`);
                return [id, inputData.toString()];
              })
            ) as Record<TInputId, string>;

            if (await validate(passwords)) {
              onClose(
                checks
                  ? (Object.fromEntries(
                      Object.keys(checks).map((id) => {
                        return [id, formData.has(id)];
                      })
                    ) as Record<TCheckId, boolean>)
                  : true
              );
            } else {
              setError("Wrong password.");
              setIsLoading(false);
            }
          } catch (e) {
            setError(e instanceof Error ? e.message : JSON.stringify(e));
            setIsLoading(false);
          }
        }}
      >
        {message ? (
          <Text
            as="span"
            variant="body"
            dangerouslySetInnerHTML={{ __html: mdToHtml(message) }}
          />
        ) : null}
        {Object.entries<FieldProps>(inputs).map(([id, input], index) => (
          <Field
            autoFocus={index === 0}
            {...input}
            key={id}
            id={id}
            name={id}
            data-test-id={id}
            required
            type="password"
          />
        ))}

        {checks
          ? Object.entries<Check>(checks).map(([id, check]) => (
              <Label
                key={id}
                mt={2}
                sx={{
                  fontSize: "body",
                  fontFamily: "body",
                  alignItems: "center",
                  color: "paragraph"
                }}
              >
                <Checkbox
                  id={id}
                  name={id}
                  defaultChecked={check.default}
                  sx={{ mr: "small", width: 18, height: 18 }}
                />
                {check.text}
              </Label>
            ))
          : null}

        {error && (
          <Text mt={1} variant={"error"}>
            {error}
          </Text>
        )}
      </Box>
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
