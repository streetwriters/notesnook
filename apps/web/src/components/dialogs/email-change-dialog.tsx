/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import { Text } from "@theme-ui/components";
import { useCallback, useRef, useState } from "react";
import { db } from "../../common/db";
import { Perform } from "../../common/dialog-controller";
import { useTimer } from "../../hooks/use-timer";
import Field from "../field";
import { Loading } from "../icons";
import Dialog from "./dialog";

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
      onClose={props.onClose}
      positiveButton={{
        text: "Next",
        disabled: isLoading,
        loading: isLoading,
        onClick: async () => {
          try {
            setError(undefined);
            setIsLoading(true);

            if (emailChangeState) {
              const code = codeRef.current?.value;
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
            } else {
              const password = passwordRef.current?.value;
              if (!password || !(await db.user?.verifyPassword(password))) {
                setError("Password is not correct.");
                return;
              }

              const newEmail = emailRef.current?.value;
              if (!newEmail) {
                setError("Email is required.");
                return;
              }
              await db.user?.sendVerificationEmail(newEmail);

              setEmailChangeState({ newEmail, password });
            }
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setIsLoading(false);
          }
        }
      }}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      {emailChangeState ? (
        <Field
          inputRef={codeRef}
          id="code"
          name="code"
          label="6-digit code"
          helpText={`Enter 6-digit code sent to ${emailChangeState.newEmail}`}
          type="email"
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
            id="new_email"
            name="new_email"
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
        </>
      )}
      {error && <Text variant="error">{error}</Text>}
    </Dialog>
  );
}
