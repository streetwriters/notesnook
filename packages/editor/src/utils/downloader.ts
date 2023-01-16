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
export type DownloadOptions = {
  corsHost: string;
};

export async function downloadImage(url: string, options?: DownloadOptions) {
  if (options?.corsHost) url = `${options.corsHost}/${url}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`invalid status code ${response.status}`);

  const contentType = response.headers.get("Content-Type");
  const contentLength = response.headers.get("Content-Length");

  if (
    !contentType ||
    !contentLength ||
    contentLength === "0" ||
    !contentType.startsWith("image/")
  )
    throw new Error("not an image");

  const size = parseInt(contentLength);
  const blob = await response.blob();
  return {
    blob,
    url: URL.createObjectURL(blob),
    type: contentType,
    size
  };
}

export function toDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (_e) => resolve(reader.result as string);
    reader.onerror = (_e) => reject(reader.error);
    reader.onabort = (_e) => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
}

export function isDataUrl(url?: string): boolean {
  return url?.startsWith("data:") || false;
}

export async function toBlobURL(dataurl: string) {
  if (!isDataUrl(dataurl)) return dataurl;

  const response = await fetch(dataurl);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
