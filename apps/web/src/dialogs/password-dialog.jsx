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

import { useState, useCallback, useMemo } from "react";
import { Box, Text } from "@theme-ui/components";
import Dialog from "../components/dialog";
import Field from "../components/field";
import { Checkbox, Label } from "@theme-ui/components";

function PasswordDialog(props) {
  const { type, checks } = props;
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const isChangePasswordDialog = useMemo(() => {
    return type === "change_password" || type === "change_account_password";
  }, [type]);

  const submit = useCallback(
    async (data) => {
      setIsLoading(true);
      setError(false);
      try {
        if (await props.validate(data)) {
          props.onDone();
        } else {
          setError("Wrong password.");
          setIsLoading(false);
        }
      } catch (e) {
        setError(e.message);
        setIsLoading(false);
      }
    },
    [props]
  );
  return (
    <Dialog
      testId="password-dialog"
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      icon={props.icon}
      onClose={() => props.onClose(false)}
      positiveButton={{
        form: "passwordForm",
        type: "submit",
        text: props.positiveButtonText,
        loading: isLoading,
        disabled: isLoading
      }}
      negativeButton={{
        text: "Cancel",
        onClick: () => props.onClose(false),
        disabled: isLoading
      }}
    >
      <Box
        id="passwordForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = Object.fromEntries(new FormData(e.target).entries());
          setError();
          await submit(data);
        }}
      >
        <Field
          autoFocus
          required
          data-test-id="dialog-password"
          label={isChangePasswordDialog ? "Old password" : "Password"}
          type="password"
          autoComplete={
            type === "create_vault" ? "new-password" : "current-password"
          }
          id={isChangePasswordDialog ? "oldPassword" : "password"}
          name={isChangePasswordDialog ? "oldPassword" : "password"}
        />

        {isChangePasswordDialog ? (
          <Field
            required
            data-test-id="dialog-new-password"
            label="New password"
            type="password"
            autoComplete="new-password"
            id="newPassword"
            name="newPassword"
          />
        ) : null}

        {checks &&
          checks.map((check) => (
            <Label
              key={check.key}
              mt={2}
              sx={{
                fontSize: "body",
                fontFamily: "body",
                alignItems: "center",
                color: "paragraph"
              }}
            >
              <Checkbox id={check.key} name={check.key} />
              {check.title}
            </Label>
          ))}

        {error && (
          <Text mt={1} variant={"error"}>
            {error}
          </Text>
        )}
      </Box>
    </Dialog>
  );
}
export default PasswordDialog;
