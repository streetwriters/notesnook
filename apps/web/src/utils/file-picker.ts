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

type FilePickerOptions = { acceptedFileTypes: string };

export function showFilePicker({
  acceptedFileTypes
}: FilePickerOptions): Promise<File | undefined> {
  return new Promise((resolve) => {
    PAGE_VISIBILITY_CHANGE.ignore = true;
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", acceptedFileTypes);
    input.dispatchEvent(new MouseEvent("click"));
    input.onchange = async function () {
      if (!input.files) return resolve(undefined);
      const file = input.files[0];
      if (!file) return resolve(undefined);
      resolve(file);
    };
  });
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
