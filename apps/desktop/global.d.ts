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
/* eslint-disable no-var */

import { BrowserWindow } from "electron";
import {
  type FormData as FormDataType,
  type Headers as HeadersType,
  type Request as RequestType,
  type Response as ResponseType
} from "undici";

declare global {
  var window: BrowserWindow | null;
  var RELEASE: boolean;
  var MAC_APP_STORE: boolean;

  // Re-export undici fetch function and various classes to global scope.
  // These are classes and functions expected to be at global scope according to Node.js v18 API
  // documentation.
  // See: https://nodejs.org/dist/latest-v18.x/docs/api/globals.html
  // eslint-disable-next-line no-var
  export var {
    FormData,
    Headers,
    Request,
    Response,
    fetch
  }: typeof import("undici");

  type FormData = FormDataType;
  type Headers = HeadersType;
  type Request = RequestType;
  type Response = ResponseType;
}

// NOTE: the import in the global block above needs to be a var for this to work properly.
globalThis.fetch = fetch;
globalThis.FormData = FormData;
globalThis.Headers = Headers;
globalThis.Request = Request;
globalThis.Response = Response;
