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

import { files, lifecycle, type PickedFile } from "@platform";
import { strings } from "@notesnook/intl";
import { TaskManager } from "../common/task-manager";

type FilePickerOptions = { acceptedFileTypes: string; multiple?: boolean };

export async function showFilePicker({
  acceptedFileTypes,
  multiple
}: FilePickerOptions): Promise<PickedFile[]> {
  lifecycle.ignoreNextVisibilityChange();
  const result = await TaskManager.startTask<PickedFile[]>({
    type: "modal",
    title: strings.processing(),
    subtitle: strings.pleaseWait(),
    action: () => files.pick({ acceptedFileTypes, multiple })
  });
  return result instanceof Error ? [] : result;
}

export function readFile(file: PickedFile): Promise<string> {
  return file.text();
}
