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
import { Button, Dialog, Flex, Text } from "@ui";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { Field } from "./components/field";

export type BackupPasswordDialogProps = BaseDialogProps<boolean> & {
  validate: (outputs: {
    password?: string;
    key?: string;
  }) => boolean | Promise<boolean>;
};

export const BackupPasswordDialog = DialogManager.register(
  function BackupPasswordDialog(props: BackupPasswordDialogProps) {
    const { onClose, validate } = props;
    const [error, setError] = useState<string>();
    const [isLoading, setIsLoading] = useState(false);
    const [isEncryptionKey, setIsEncryptionKey] = useState(false);
    const value = useRef("");

    const onSubmit = async () => {
      try {
        setIsLoading(true);
        setError(undefined);
        const input = value.current;
        if (!input) return;
        const outputs = isEncryptionKey
          ? { key: input, password: undefined }
          : { key: undefined, password: input };
        if (await validate(outputs)) {
          onClose(true);
        } else {
          setError(strings.passwordIncorrect());
        }
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <Dialog
        isOpen={true}
        testID="password-dialog"
        title={strings.encryptedBackup()}
        description={strings.encryptedBackupDesc()}
        onClose={() => onClose(false)}
        positiveButton={{
          loading: isLoading,
          disabled: isLoading,
          text: strings.restore(),
          onClick: onSubmit
        }}
        negativeButton={{
          text: strings.cancel(),
          onClick: () => onClose(false)
        }}
      >
        <Flex sx={{ flexDirection: "column" }}>
          <Field
            key={isEncryptionKey ? "key" : "password"}
            required
            autoFocus
            testID={isEncryptionKey ? "encryption-key" : "password"}
            label={
              isEncryptionKey ? strings.encryptionKey() : strings.password()
            }
            type="password"
            id={isEncryptionKey ? "key" : "password"}
            onChangeText={(text) => (value.current = text)}
            onSubmit={() => onSubmit()}
          />
          <Button
            variant="anchor"
            onPress={() => {
              value.current = "";
              setIsEncryptionKey((s) => !s);
            }}
          >
            <Text>{strings.useEncryptionKey()}</Text>
          </Button>
          {error && (
            <Text variant="error" sx={{ mt: 1 }}>
              {error}
            </Text>
          )}
        </Flex>
      </Dialog>
    );
  }
);
