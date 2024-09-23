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

import { DataURL } from "@notesnook/common";

export type DownloadOptions = {
  corsHost?: string;
  signal?: AbortSignal;
};

/**
 * macOS uses its own Uniform Type Identifier format instead of mime-types.
 * This is an incomplete map of UTI->mime-type for image types taken from
 * https://gist.github.com/RhetTbull/7221ef3cfd9d746f34b2550d4419a8c2
 */
const UTITypes: Record<string, string> = {
  "com.microsoft.bmp": "image/bmp",
  "com.canon.crw-raw-image": "image/x-canon-crw",
  "com.adobe.raw-image": "image/x-adobe-dng",
  "com.dxo.raw-image": "image/x-dxo-dxo",
  "com.j2.efx-fax": "image/efax",
  "com.epson.raw-image": "image/x-epson-erf",
  "com.kodak.flashpix-image": "image/fpx",
  "com.compuserve.gif": "image/gif",
  "com.microsoft.ico": "image/vnd.microsoft.icon",
  "public.jpeg": "image/jpeg",
  "public.jpeg-2000": "image/jp2",
  "com.nikon.nrw-raw-image": "image/x-nikon-nrw",
  "com.apple.pict": "image/pict",
  "public.png": "image/png",
  "com.adobe.photoshop-image": "image/vnd.adobe.photoshop",
  "com.leica.pwl-raw-image": "image/x-leica-pwl",
  "com.apple.quicktime-image": "image/x-quicktime",
  "com.sgi.sgi-image": "image/sgi",
  "com.sony.sr2-raw-image": "image/x-sony-sr2",
  "public.svg-image": "image/svg+xml",
  "com.truevision.tga-image": "image/targa",
  "public.tiff": "image/tiff",
  "public.xbitmap-image": "image/x-xbitmap",
  "public.avci": "image/avci",
  "public.avcs": "image/avcs",
  "public.heic": "image/heic",
  "public.heif": "image/heif",
  "public.heics": "image/heic-sequence",
  "public.heifs": "image/heif-sequence"
};

export function corsify(url?: string, host?: string) {
  if (host && url && !url.startsWith("blob:") && !DataURL.isValid(url))
    return `${host}/${url}`;
  return url;
}

export async function downloadImage(url: string, options?: DownloadOptions) {
  const corsifiedURL = corsify(url, options?.corsHost);
  if (!corsifiedURL) return;

  const response = await fetch(corsifiedURL, {
    mode: "cors",
    credentials: "omit",
    cache: "force-cache",
    signal: options?.signal
  });
  if (!response.ok) throw new Error(`invalid status code ${response.status}`);

  let contentType = response.headers.get("Content-Type");

  if (contentType && UTITypes[contentType]) contentType = UTITypes[contentType];

  if (!contentType || !contentType.startsWith("image/")) return;

  let blob = await response.blob();
  if (UTITypes[blob.type])
    blob = new Blob([blob], {
      type: contentType
    });

  return {
    blob,
    url: URL.createObjectURL(blob),
    mimeType: contentType,
    size: blob.size
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

const OBJECT_URL_CACHE: Record<string, string | undefined> = {};
export function toBlobURL(
  dataurl: string,
  type: "image" | "other" = "other",
  mimeType?: string,
  id?: string
) {
  if (id && OBJECT_URL_CACHE[id]) return OBJECT_URL_CACHE[id];
  if (!DataURL.isValid(dataurl)) return;

  const dataurlObject = DataURL.toObject(dataurl);
  let mime = dataurlObject.mimeType || "";
  const data = dataurlObject.data;

  if (!data) return;

  // sometimes the provided mime type in the dataurl can be wrong so we
  // fallback and make sure the browser loads the image properly.
  if (type === "image" && !mime.startsWith("image/")) {
    mime = mimeType && mimeType.startsWith("image/") ? mimeType : "image/*";
  }

  const objectURL = URL.createObjectURL(
    new Blob([Buffer.from(data, "base64")], { type: mimeType })
  );

  if (id) OBJECT_URL_CACHE[id] = objectURL;
  return objectURL;
}

export function revokeBloburl(id: string) {
  const url = OBJECT_URL_CACHE[id];
  if (!url) return;

  URL.revokeObjectURL(url);
  OBJECT_URL_CACHE[id] = undefined;
}
