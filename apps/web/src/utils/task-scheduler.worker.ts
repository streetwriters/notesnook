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

import { CronosTask, CronosExpression } from "cronosjs";
import { expose } from "comlink";

const RUNNING_TASKS: Record<string, CronosTask> = {};
const module = {
  registerTask: (id: string, pattern: string) => {
    if (RUNNING_TASKS[id]) module.stop(id);

    const expression = CronosExpression.parse(pattern, { strict: true });
    const task = new CronosTask(expression);

    task
      .on("started", () => {
        console.log("started", id, pattern);
        RUNNING_TASKS[id] = task;
      })
      .on("run", () => {
        globalThis.postMessage({ type: "task-run", id });
      })
      .on("stopped", () => {
        console.log("stopping", id, pattern);
        globalThis.postMessage({ type: "task-stop", id });
      })
      .on("ended", () => {
        globalThis.postMessage({ type: "task-end", id });
        delete RUNNING_TASKS[id];
      })
      .start();
  },
  stop: (id: string) => {
    if (RUNNING_TASKS[id] && RUNNING_TASKS[id].isRunning) {
      RUNNING_TASKS[id].stop();
      delete RUNNING_TASKS[id];
    }
  },
  stopAllWithPrefix: (prefix: string) => {
    for (const id in RUNNING_TASKS) {
      if (id.startsWith(prefix)) module.stop(id);
    }
  },
  stopAll: () => {
    for (const id in RUNNING_TASKS) {
      module.stop(id);
    }
  }
};

expose(module);
export type TaskScheduler = typeof module;
export type TaskSchedulerEvent = {
  type: "task-run" | "task-stop" | "task-end";
  id: string;
};
