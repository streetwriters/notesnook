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

import type * as Contract from "../../../platform";
import { unimplemented } from "./unimplemented";
import { clipboard } from "./clipboard";
import { compression } from "./compression";
import { config } from "./config";
import { crypto } from "./crypto";
import { databaseHost } from "./database";
import { environment } from "./environment";
import { files } from "./files";
import { history } from "./history";
import { imageCompressor } from "./image-compressor";
import { integration } from "./integration";
import { keyboard } from "./keyboard";
import { kvStore } from "./kv-store";
import { lifecycle } from "./lifecycle";
import { notifications } from "./notifications";
import { shell } from "./shell";
import { updater } from "./updater";
import { webauthn } from "./webauthn";
import { windowControls } from "./window";

export {
  clipboard,
  compression,
  config,
  crypto,
  databaseHost,
  environment,
  files,
  history,
  imageCompressor,
  integration,
  keyboard,
  kvStore,
  lifecycle,
  notifications,
  shell,
  updater,
  webauthn,
  windowControls
};

export const attachmentFiles =
  unimplemented<Contract.AttachmentFiles>("attachmentFiles");
export const spellChecker =
  unimplemented<Contract.SpellChecker>("spellChecker");

export type * from "../../../platform";

export const contract: typeof Contract = {
  attachmentFiles,
  clipboard,
  compression,
  config,
  crypto,
  databaseHost,
  environment,
  files,
  history,
  imageCompressor,
  integration,
  keyboard,
  kvStore,
  lifecycle,
  notifications,
  shell,
  spellChecker,
  updater,
  webauthn,
  windowControls
};
