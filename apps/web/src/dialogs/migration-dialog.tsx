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

import { EVENTS } from "@notesnook/core";
import { Text } from "@theme-ui/components";
import { useCallback, useEffect, useState } from "react";
import { createBackup } from "../common";
import { db } from "../common/db";
import { TaskManager } from "../common/task-manager";
import Dialog from "../components/dialog";
import { ErrorText } from "../components/error-text";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";

type MigrationProgressEvent = {
  collection: string;
  total: number;
  current: number;
};

export type MigrationDialogProps = BaseDialogProps<boolean>;
export const MigrationDialog = DialogManager.register(function MigrationDialog(
  props: MigrationDialogProps
) {
  const [error, setError] = useState<Error>();
  const [isProcessing, setIsProcessing] = useState(false);

  const startMigration = useCallback(async () => {
    setIsProcessing(true);

    await createBackup();

    await TaskManager.startTask({
      type: "modal",
      title: strings.applyingChanges(),
      subtitle: strings.thisMayTakeAWhile(),
      action: async (task) => {
        db.eventManager.subscribe(
          EVENTS.migrationProgress,
          ({ collection, total, current }: MigrationProgressEvent) => {
            task({
              text: strings.processingCollection(collection),
              current,
              total
            });
          }
        );
        task({ text: strings.processing() });
        try {
          await db.migrations.migrate();

          props.onClose(true);
        } catch (e) {
          console.error(e);
          if (e instanceof Error) setError(e);
        }
      }
    });
  }, [props]);

  useEffect(() => {
    if (IS_DESKTOP_APP) {
      (async () => {
        await startMigration();
      })();
    }
  }, [startMigration]);

  if (error) {
    return (
      <Dialog
        isOpen={true}
        title={strings.migrationFailed()}
        description={""}
        positiveButton={{
          text: strings.tryAgain(),
          onClick: startMigration
        }}
      >
        <ErrorText
          error={error}
          as="p"
          sx={{
            borderRadius: "default",
            wordWrap: "normal",
            overflowWrap: "break-word"
          }}
        />
        <Text as="p" variant={"subBody"} sx={{ mt: 2 }}>
          {strings.migrationErrorNotice()[0]}{" "}
          <a href="https://discord.com/invite/zQBK97EE22">Discord</a>{" "}
          {strings.migrationErrorNotice()[1]}{" "}
          <a href="mailto:support@streetwriters.co">support@streetwriters.co</a>
        </Text>
      </Dialog>
    );
  }

  if (IS_DESKTOP_APP || isProcessing) return null;

  return (
    <Dialog
      width={500}
      isOpen={true}
      title={strings.migrationSaveBackup()}
      description={""}
      positiveButton={{
        text: strings.saveAndContinue(),
        onClick: startMigration
      }}
    >
      <Text as="p" variant={"body"}>
        {strings.migrationSaveBackupDesc()}
      </Text>
    </Dialog>
  );
});
