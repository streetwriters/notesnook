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

import { useCallback, useEffect, useState } from "react";
import { EVENTS } from "@notesnook/core";
import { Dialog, Flex, Text } from "@ui";
import { environment } from "@platform";
import { createBackup } from "../common";
import { db } from "../common/db";
import { TaskManager } from "../common/task-manager";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { ErrorText } from "../components/error-text";
import { LinkText } from "./components/link-text";

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
    if (environment.isDesktopApp) {
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
        <ErrorText error={error} sx={{ borderRadius: "default" }} />
        <Text variant="subBody" sx={{ mt: 2 }}>
          {strings.migrationErrorNotice()[0]}{" "}
          <LinkText href="https://discord.com/invite/zQBK97EE22">
            Discord
          </LinkText>{" "}
          {strings.migrationErrorNotice()[1]}{" "}
          <LinkText href="mailto:support@streetwriters.co">
            support@streetwriters.co
          </LinkText>
        </Text>
      </Dialog>
    );
  }

  if (environment.isDesktopApp || isProcessing) return null;

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
      <Flex>
        <Text variant="body">{strings.migrationSaveBackupDesc()}</Text>
      </Flex>
    </Dialog>
  );
});
