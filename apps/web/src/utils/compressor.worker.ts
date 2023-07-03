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

import { expose } from "comlink";
import { gzip, gunzip } from "fflate";
import { fromBase64, toBase64 } from "@aws-sdk/util-base64-browser";

const module = {
  gzip: ({ data, level }: { data: string; level: number }) => {
    return new Promise<string>((resolve, reject) => {
      gzip(
        new TextEncoder().encode(data),
        { level: level as any },
        (err, data) => (err ? reject(err) : resolve(toBase64(data)))
      );
    });
  },
  gunzip: ({ data }: { data: string }) => {
    return new Promise<string>((resolve, reject) => {
      gunzip(fromBase64(data), (err, data) =>
        err ? reject(err) : resolve(new TextDecoder().decode(data))
      );
    });
  }
};

expose(module);
export type Compressor = typeof module;
