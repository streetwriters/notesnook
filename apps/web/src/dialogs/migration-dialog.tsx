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

import { EVENTS } from "@notesnook/core/dist/common";
import { Text } from "@theme-ui/components";
import { useCallback, useEffect, useState } from "react";
import { createBackup } from "../common";
import { db } from "../common/db";
import { Perform } from "../common/dialog-controller";
import { TaskManager } from "../common/task-manager";

import Dialog from "../components/dialog";
import { ErrorText } from "../components/error-text";

type MigrationProgressEvent = {
  collection: string;
  total: number;
  current: number;
};

export type MigrationDialogProps = {
  onClose: Perform;
};

export default function MigrationDialog(props: MigrationDialogProps) {
  const [error, setError] = useState<Error>();
  const [isProcessing, setIsProcessing] = useState(false);

  const startMigration = useCallback(async () => {
    setIsProcessing(true);

    await createBackup();

    await TaskManager.startTask({
      type: "modal",
      title: `Applying changes...`,
      subtitle: "This might take while.",
      action: async (task) => {
        db.eventManager.subscribe(
          EVENTS.migrationProgress,
          ({ collection, total, current }: MigrationProgressEvent) => {
            task({
              text: `Processing ${collection}...`,
              current,
              total
            });
          }
        );
        task({ text: `Processing...` });
        try {
          await db.migrations?.migrate();

          props.onClose(true);
        } catch (e) {
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
        title={"There was an error"}
        description={""}
        positiveButton={{
          text: "Try again",
          onClick: startMigration
        }}
      >
        <ErrorText
          error={error.stack}
          as="p"
          sx={{
            borderRadius: "default",
            wordWrap: "normal",
            overflowWrap: "break-word"
          }}
        />
        <Text as="p" variant={"subBody"} sx={{ mt: 2 }}>
          If this continues to happen, please reach out to us via{" "}
          <a href="https://discord.com/invite/zQBK97EE22">Discord</a> or email
          us at{" "}
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
      title={"Save a backup of your notes"}
      description={""}
      positiveButton={{
        text: "Save & continue",
        onClick: startMigration
      }}
    >
      <Text as="p" variant={"body"}>
        {
          "Thank you for updating Notesnook! We'll be applying some minor changes for a better note taking experience."
        }
      </Text>
    </Dialog>
  );
}
