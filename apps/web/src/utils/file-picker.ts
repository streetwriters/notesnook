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

import { PAGE_VISIBILITY_CHANGE } from "./page-visibility";
import { strings } from "@notesnook/intl";
import { TaskManager } from "../common/task-manager";

type FilePickerOptions = { acceptedFileTypes: string; multiple?: boolean };

export async function showFilePicker({
  acceptedFileTypes,
  multiple
}: FilePickerOptions): Promise<File[]> {
  PAGE_VISIBILITY_CHANGE.ignore = true;
  const input = document.createElement("input");
  input.setAttribute("type", "file");
  input.setAttribute("multiple", `${multiple || false}`);
  input.setAttribute("accept", acceptedFileTypes);
  input.dispatchEvent(new MouseEvent("click"));
  const result = await TaskManager.startTask<File[]>({
    type: "modal",
    title: strings.processing(),
    subtitle: strings.pleaseWait(),
    action: () =>
      new Promise((resolve) => {
        input.oncancel = async function () {
          resolve([]);
        };
        input.onchange = async function () {
          if (!input.files) return resolve([]);
          resolve(Array.from(input.files));
        };
      })
  });
  return result instanceof Error ? [] : result;
}

export async function readFile(file: File): Promise<string> {
  const reader = new FileReader();
  return await new Promise<string>((resolve, reject) => {
    reader.addEventListener("load", (event) => {
      const text = event.target?.result as string;
      if (!text) return reject("FileReader failed to load file.");
      resolve(text);
    });
    reader.readAsText(file);
  });
}
