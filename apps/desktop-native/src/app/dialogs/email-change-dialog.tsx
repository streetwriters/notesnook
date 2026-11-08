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

import { useCallback, useRef, useState } from "react";
import { Dialog, Flex, Text } from "@ui";
import { db } from "../common/db";
import { useTimer } from "../hooks/use-timer";
import { Loading } from "../components/icons";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { useStore as useUserStore } from "../stores/user-store";
import { Field } from "./components/field";

type EmailChangeState = {
  newEmail: string;
  password: string;
};

export type EmailChangeDialogProps = BaseDialogProps<boolean>;

export const EmailChangeDialog = DialogManager.register(
  function EmailChangeDialog(props: EmailChangeDialogProps) {
    const [error, setError] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [emailChangeState, setEmailChangeState] =
      useState<EmailChangeState>();
    const [isSending, setIsSending] = useState(false);
    const { elapsed, enabled, setEnabled } = useTimer(`email_change_code`, 60);
    const values = useRef({ newEmail: "", password: "", code: "" });

    const sendCode = useCallback(
      async (emailChangeState: EmailChangeState) => {
        setIsSending(true);
        try {
          await db.user.sendVerificationEmail(emailChangeState.newEmail);
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

    const onSubmit = async () => {
      try {
        setIsLoading(true);
        setError(undefined);
        const { password, newEmail, code } = values.current;

        if (emailChangeState) {
          if (!code || code.length < 6) {
            setError(strings.enterSixDigitCode());
            return;
          }
          await db.user.changeEmail(
            emailChangeState.newEmail,
            emailChangeState.password,
            code
          );
          await useUserStore.getState().refreshUser();
          props.onClose(true);
          return;
        }

        if (!newEmail.trim() || !password.trim()) return;
        if (!password || !(await db.user.verifyPassword(password))) {
          setError(strings.passwordIncorrect());
          return;
        }
        await db.user.sendVerificationEmail(newEmail);
        setEnabled(false);
        setEmailChangeState({ newEmail, password });
      } catch (e) {
        if (e instanceof Error) setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog
        isOpen={true}
        title={strings.changeEmail()}
        description={strings.changeEmailDesc()}
        onClose={() => props.onClose(false)}
        positiveButton={{
          text: strings.next(),
          disabled: isLoading,
          loading: isLoading,
          onClick: onSubmit
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => props.onClose(false)
        }}
      >
        <Flex sx={{ flexDirection: "column" }}>
          {emailChangeState ? (
            <Field
              id="code"
              label={strings.sixDigitCode()}
              helpText={strings.enterSixDigitCode()}
              type="text"
              required
              onChangeText={(text) => (values.current.code = text)}
              onSubmit={() => onSubmit()}
              action={{
                disabled: isSending || !enabled,
                component: (
                  <Text variant="body">
                    {isSending ? (
                      <Loading size={18} />
                    ) : enabled ? (
                      strings.resendCode()
                    ) : (
                      strings.resendCode(elapsed)
                    )}
                  </Text>
                ),
                onPress: async () => {
                  await sendCode(emailChangeState);
                }
              }}
            />
          ) : (
            <>
              <Field
                id="newEmail"
                label={strings.newEmail()}
                type="email"
                required
                onChangeText={(text) => (values.current.newEmail = text)}
              />
              <Field
                id="password"
                label={strings.accountPassword()}
                type="password"
                required
                onChangeText={(text) => (values.current.password = text)}
                onSubmit={() => onSubmit()}
              />
              <Text variant="subBody" sx={{ mt: 1 }}>
                {strings.changeEmailNotice()}
              </Text>
            </>
          )}
          {error && <Text variant="error">{error}</Text>}
        </Flex>
      </Dialog>
    );
  }
);
