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
import zlib from "node:zlib";
import utils from "node:util";

const gzipAsync = utils.promisify(zlib.gzip);
const gunzipAsync = utils.promisify(zlib.gunzip);

export async function gzip(args) {
  const { data, level } = args;
  return (await gzipAsync(data, { level })).toString("base64");
}

export async function gunzip(args) {
  const { data } = args;
  return (await gunzipAsync(Buffer.from(data, "base64"))).toString("utf-8");
}
