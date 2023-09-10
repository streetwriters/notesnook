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

import { Flex, Text } from "@theme-ui/components";
import { useCallback, useRef, useState } from "react";
import { db } from "../common/db";
import { Perform } from "../common/dialog-controller";
import { useTimer } from "../hooks/use-timer";
import Field from "../components/field";
import { Loading } from "../components/icons";
import Dialog from "../components/dialog";

type EmailChangeState = {
  newEmail: string;
  password: string;
};
export type EmailChangeDialogProps = {
  onClose: Perform;
};

export default function EmailChangeDialog(props: EmailChangeDialogProps) {
  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [emailChangeState, setEmailChangeState] = useState<EmailChangeState>();
  const [isSending, setIsSending] = useState(false);
  const { elapsed, enabled, setEnabled } = useTimer(`email_change_code`, 60);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  const sendCode = useCallback(
    async (emailChangeState: EmailChangeState) => {
      setIsSending(true);
      try {
        await db.user?.sendVerificationEmail(emailChangeState.newEmail);

        setEnabled(false);
      } catch (e) {
        const error = e as Error;
        setError(error.message);
      } finally {
        setIsSending(false);
      }
    },
    [setEnabled]
  );

  return (
    <Dialog
      isOpen={true}
      title={"Change account email"}
      description={
        "Your account email will be changed without affecting your subscription or any other settings."
      }
      onClose={() => props.onClose(false)}
      positiveButton={{
        text: "Next",
        disabled: isLoading,
        loading: isLoading,
        form: "changeEmailForm"
      }}
      negativeButton={{ text: "Cancel", onClick: () => props.onClose(false) }}
    >
      <Flex
        id="changeEmailForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            setIsLoading(true);
            setError(undefined);

            const formData = new FormData(e.target as HTMLFormElement);
            const { password, newEmail, code } = Object.fromEntries(
              formData.entries() as IterableIterator<[string, string]>
            );

            if (emailChangeState) {
              if (!code || code.length < 6) {
                setError("Please enter a valid verification code.");
                return;
              }

              await db.user?.changeEmail(
                emailChangeState.newEmail,
                emailChangeState.password,
                code
              );
              props.onClose(true);
              return;
            }

            if (!newEmail.trim() || !password.trim()) return;

            if (!password || !(await db.user?.verifyPassword(password))) {
              setError("Password is not correct.");
              return;
            }

            await db.user?.sendVerificationEmail(newEmail);
            setEmailChangeState({ newEmail, password });
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          } finally {
            setIsLoading(false);
          }
        }}
        sx={{ flexDirection: "column" }}
      >
        {emailChangeState ? (
          <Field
            inputRef={codeRef}
            id="code"
            name="code"
            label="6-digit code"
            helpText={`Enter 6-digit code sent to ${emailChangeState.newEmail}`}
            type="text"
            required
            action={{
              disabled: isSending || !enabled,
              component: (
                <Text variant={"body"}>
                  {isSending ? (
                    <Loading size={18} />
                  ) : enabled ? (
                    `Resend code`
                  ) : (
                    `Resend in ${elapsed}`
                  )}
                </Text>
              ),
              onClick: async () => {
                await sendCode(emailChangeState);
              }
            }}
          />
        ) : (
          <>
            <Field
              inputRef={emailRef}
              id="newEmail"
              name="newEmail"
              label="New email"
              type="email"
              required
            />
            <Field
              inputRef={passwordRef}
              id="password"
              name="password"
              label="Your account password"
              type="password"
              required
            />
            <Text variant="subBody" sx={{ mt: 1 }}>
              You will be logged out from all your other devices.
            </Text>
          </>
        )}
        {error && <Text variant="error">{error}</Text>}
      </Flex>
    </Dialog>
  );
}
