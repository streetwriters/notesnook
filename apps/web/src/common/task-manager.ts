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

import { ProgressDialog } from "../dialogs/progress-dialog";
import { removeStatus, updateStatus } from "../hooks/use-status";

type TaskType = "status" | "modal";
export type TaskAction<T> = (report: ProgressReportCallback) => T | Promise<T>;
type BaseTaskDefinition<TTaskType extends TaskType, TReturnType> = {
  type: TTaskType;
  action: TaskAction<TReturnType>;
};

type StatusTaskDefinition<TReturnType> = BaseTaskDefinition<
  "status",
  TReturnType
> & {
  title: string;
  id: string;
};

type ModalTaskDefinition<TReturnType> = BaseTaskDefinition<
  "modal",
  TReturnType
> & {
  title: string;
  subtitle?: string;
};

type TaskDefinition<TReturnType> =
  | StatusTaskDefinition<TReturnType>
  | ModalTaskDefinition<TReturnType>;

type TaskProgress = {
  total?: number;
  current?: number;
  text: string;
};

type ProgressReportCallback = (progress: TaskProgress) => void;

export class TaskManager {
  static async startTask<T>(task: TaskDefinition<T>): Promise<T | Error> {
    switch (task.type) {
      case "status": {
        const statusTask = task;
        updateStatus({
          key: statusTask.id,
          status: task.title
        });
        const result = await statusTask.action((progress) => {
          let percentage: number | undefined = undefined;
          if (progress.current && progress.total)
            percentage = Math.round((progress.current / progress.total) * 100);

          updateStatus({
            key: statusTask.id,
            status: progress.text,
            progress: percentage
          });
        });
        removeStatus(statusTask.id);
        return result;
      }
      case "modal": {
        return (await ProgressDialog.show({
          title: task.title,
          subtitle: task.subtitle,
          action: task.action
        })) as T;
      }
    }
  }
}
