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
import { Perform } from "../common/dialog-controller";
import Field from "../components/field";
import Dialog from "../components/dialog";
import { Box, Button } from "@theme-ui/components";

export type PromptDialogProps = {
  onClose: Perform;
  validate: (outputs: {
    password?: string;
    key?: string;
  }) => boolean | Promise<boolean>;
};

export default function BackupPasswordDialog(props: PromptDialogProps) {
  const { onClose, validate } = props;

  const [error, setError] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [isEncryptionKey, setIsEncryptionKey] = useState(false);

  return (
    <Dialog
      isOpen={true}
      title={"Encrypted backup"}
      description={
        "Please enter the password to decrypt and restore this backup."
      }
      onClose={() => onClose(false)}
      positiveButton={{
        form: "backupPasswordForm",
        type: "submit",
        loading: isLoading,
        disabled: isLoading,
        text: "Restore"
      }}
      negativeButton={{ text: "Cancel", onClick: () => onClose(false) }}
    >
      <Box
        id="backupPasswordForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);

          try {
            setIsLoading(true);
            setError(undefined);

            const key = formData.get("key") as string;
            const password = formData.get("password") as string;
            if (!key && !password) return;

            if (await validate({ key, password })) {
              onClose(true);
            } else {
              setError("Wrong password.");
            }
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setIsLoading(false);
          }
        }}
      >
        {isEncryptionKey ? (
          <Field
            required
            autoFocus
            data-test-id="dialog-key"
            label="Encryption key"
            type="password"
            id="key"
            name="key"
          />
        ) : (
          <Field
            required
            autoFocus
            data-test-id="dialog-password"
            label="Password"
            type="password"
            autoComplete="current-password"
            id="password"
            name="password"
          />
        )}
      </Box>
      <Button variant="anchor" onClick={() => setIsEncryptionKey((s) => !s)}>
        {isEncryptionKey
          ? "Don't have encryption key? Use password."
          : "Forgot password? Use encryption key."}
      </Button>
    </Dialog>
  );
}
