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
import * as undici_types from "undici";

declare global {
  export const {
    fetch,
    FormData,
    Headers,
    Request,
    Response
  }: typeof import("undici");

  type FormData = undici_types.FormData;
  type Headers = undici_types.Headers;
  type HeadersInit = undici_types.HeadersInit;
  type BodyInit = undici_types.BodyInit;
  type Request = undici_types.Request;
  type RequestInit = undici_types.RequestInit;
  type RequestInfo = undici_types.RequestInfo;
  type RequestMode = undici_types.RequestMode;
  type RequestRedirect = undici_types.RequestRedirect;
  type RequestCredentials = undici_types.RequestCredentials;
  type RequestDestination = undici_types.RequestDestination;
  type ReferrerPolicy = undici_types.ReferrerPolicy;
  type Response = undici_types.Response;
  type ResponseInit = undici_types.ResponseInit;
  type ResponseType = undici_types.ResponseType;

  var window: BrowserWindow | null;
  var RELEASE: boolean;
  var MAC_APP_STORE: boolean;
}
