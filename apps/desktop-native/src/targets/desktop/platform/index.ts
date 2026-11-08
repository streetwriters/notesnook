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

export const attachmentFiles =
  unimplemented<Contract.AttachmentFiles>("attachmentFiles");
export const clipboard = unimplemented<Contract.Clipboard>("clipboard");
export const compression = unimplemented<Contract.Compression>("compression");
export const config = unimplemented<Contract.Config>("config");
export const crypto = unimplemented<Contract.Crypto>("crypto");
export const databaseHost =
  unimplemented<Contract.DatabaseHost>("databaseHost");
export const environment = unimplemented<Contract.Environment>("environment");
export const files = unimplemented<Contract.Files>("files");
export const history = unimplemented<Contract.History>("history");
export const integration = unimplemented<Contract.Integration>("integration");
export const keyboard = unimplemented<Contract.Keyboard>("keyboard");
export const lifecycle = unimplemented<Contract.Lifecycle>("lifecycle");
export const notifications =
  unimplemented<Contract.Notifications>("notifications");
export const shell = unimplemented<Contract.Shell>("shell");
export const spellChecker =
  unimplemented<Contract.SpellChecker>("spellChecker");
export const updater = unimplemented<Contract.Updater>("updater");
export const windowControls =
  unimplemented<Contract.WindowControls>("windowControls");

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
  integration,
  keyboard,
  lifecycle,
  notifications,
  shell,
  spellChecker,
  updater,
  windowControls
};
