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

import type { AttachmentFiles } from "./fs";
import type { Clipboard } from "./clipboard";
import type { Compression } from "./compression";
import type { Config } from "./storage";
import type { Crypto } from "./crypto";
import type { DatabaseHost } from "./database";
import type { Environment } from "./environment";
import type { Files } from "./files";
import type { History } from "./history";
import type { ImageCompressor } from "./image-compressor";
import type { Integration } from "./integration";
import type { Keyboard } from "./keyboard";
import type { KVStoreFactory } from "./kv-store";
import type { Lifecycle } from "./lifecycle";
import type { Notifications } from "./notifications";
import type { SafeStorage } from "./safe-storage";
import type { Shell } from "./shell";
import type { SpellChecker } from "./spell-checker";
import type { Updater } from "./updater";
import type { Webauthn } from "./webauthn";
import type { WindowControls } from "./window";

export type * from "./clipboard";
export type * from "./compression";
export type * from "./crypto";
export type * from "./database";
export type * from "./environment";
export type * from "./files";
export type * from "./fs";
export type * from "./history";
export type * from "./image-compressor";
export type * from "./integration";
export type * from "./keyboard";
export type * from "./kv-store";
export type * from "./lifecycle";
export type * from "./notifications";
export type * from "./safe-storage";
export type * from "./shell";
export type * from "./spell-checker";
export type * from "./storage";
export type * from "./updater";
export type * from "./webauthn";
export type * from "./window";

export declare const attachmentFiles: AttachmentFiles;
export declare const clipboard: Clipboard;
export declare const compression: Compression;
export declare const config: Config;
export declare const crypto: Crypto;
export declare const databaseHost: DatabaseHost;
export declare const environment: Environment;
export declare const files: Files;
export declare const history: History;
export declare const imageCompressor: ImageCompressor;
export declare const integration: Integration;
export declare const keyboard: Keyboard;
export declare const kvStore: KVStoreFactory;
export declare const lifecycle: Lifecycle;
export declare const notifications: Notifications;
export declare const safeStorage: SafeStorage;
export declare const shell: Shell;
export declare const spellChecker: SpellChecker;
export declare const updater: Updater;
export declare const webauthn: Webauthn;
export declare const windowControls: WindowControls;
