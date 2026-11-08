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

import { CronosExpression, CronosTask, validate } from "cronosjs";
import { showToast } from "./toast";
import { logger } from "./logger";
import { strings } from "@notesnook/intl";

const tasks = new Map<string, CronosTask>();

export class TaskScheduler {
  static async register(id: string, time: string, action: () => void) {
    if (!validate(time)) {
      logger.error(`Invalid cron expression: ${time}`);
      return;
    }

    try {
      TaskScheduler.stopSync(id);
      const task = new CronosTask(
        CronosExpression.parse(time, { strict: true })
      );
      task.on("run", action);
      task.start();
      tasks.set(id, task);
    } catch (e) {
      showToast(
        "error",
        `${strings.failedToRegisterTask()}: ${
          (e as Error).message
        } (cron: ${time})`
      );
    }
  }

  private static stopSync(id: string) {
    tasks.get(id)?.stop();
    tasks.delete(id);
  }

  static async stop(id: string) {
    TaskScheduler.stopSync(id);
  }

  static async stopAll() {
    for (const id of [...tasks.keys()]) TaskScheduler.stopSync(id);
  }

  static async stopAllWithPrefix(prefix: string) {
    for (const id of [...tasks.keys()])
      if (id.startsWith(prefix)) TaskScheduler.stopSync(id);
  }
}
