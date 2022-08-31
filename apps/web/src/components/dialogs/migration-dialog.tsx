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
import { createBackup } from "../../common";
import { db } from "../../common/db";
import { Perform } from "../../common/dialog-controller";
import { TaskManager } from "../../common/task-manager";
import Dialog from "./dialog";

export type MigrationDialogProps = {
  onClose: Perform;
};

export default function MigrationDialog(props: MigrationDialogProps) {
  return (
    <Dialog
      width={500}
      isOpen={true}
      title={"Database migration required"}
      description={
        "Due to new features we need to migrate your data to a newer version. This is NOT a destructive operation."
      }
      positiveButton={{
        text: "Backup and migrate",
        onClick: async () => {
          await createBackup(true);
          await TaskManager.startTask({
            type: "modal",
            title: `Migrating your database`,
            subtitle:
              "Please do NOT close your browser/app during the migration process.",
            action: (task) => {
              task({ text: `Please wait...` });
              return db.migrations?.migrate();
            }
          });
          props.onClose(true);
        }
      }}
    >
      <Text variant={"subtitle"}>Read before continuing:</Text>
      <Text as="ol" sx={{ paddingInlineStart: 20, mt: 1 }}>
        <Text as="li" variant={"body"}>
          It is <b>required</b> that you <b>download &amp; save a backup</b> of
          your data.
        </Text>
        <Text as="li" variant={"body"}>
          Some <b>merge conflicts</b> are expected in your notes after a
          migration. It is <b>recommended</b> that you resolve them carefully.
          <Text as="ol" sx={{ paddingInlineStart: 20 }}>
            <Text as="li" variant={"body"}>
              <b>But if you are feeling reckless enough</b> to risk losing some
              data, you can logout &amp; log back in.
            </Text>
          </Text>
        </Text>
        <Text as="li" variant={"body"}>
          If you face any other issues or if you are unsure about what to do,
          feel free to reach out to us via{" "}
          <a href="https://discord.com/invite/zQBK97EE22">Discord</a> or email
          us at{" "}
          <a href="mailto:support@streetwriters.co">support@streetwriters.co</a>
        </Text>
      </Text>
    </Dialog>
  );
}
