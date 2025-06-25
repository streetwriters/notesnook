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

import EventManager from "./utils/event-manager.js";

export const EV = new EventManager();

export async function checkIsUserPremium(type: string) {
  // if (process.env.NODE_ENV === "test") return true;

  const results = await EV.publishWithResult<{ type: string; result: boolean }>(
    EVENTS.userCheckStatus,
    type
  );
  if (typeof results === "boolean") return results;
  return results.some((r) => r.type === type && r.result === true);
}

export const SYNC_CHECK_IDS = {
  autoSync: "autoSync",
  sync: "sync"
};

export type SyncStatusEvent = keyof typeof SYNC_CHECK_IDS;

export async function checkSyncStatus(type: string) {
  const results = await EV.publishWithResult<{ type: string; result: boolean }>(
    EVENTS.syncCheckStatus,
    type
  );
  if (typeof results === "boolean") return results;
  else if (typeof results === "undefined") return true;
  return results.some((r) => r.type === type && r.result === true);
}

export type SyncProgressEvent = {
  type: "upload" | "download";
  current: number;
};

export function sendSyncProgressEvent(
  EV: EventManager,
  type: string,
  current: number
) {
  EV.publish(EVENTS.syncProgress, {
    type,
    current
  } as SyncProgressEvent);
}

export function sendMigrationProgressEvent(
  EV: EventManager,
  collection: string,
  total: number,
  current?: number
) {
  EV.publish(EVENTS.migrationProgress, {
    collection,
    total,
    current: current === undefined ? total : current
  });
}

export const CLIENT_ID = "notesnook";

export const CHECK_IDS = {
  noteColor: "note:color",
  noteTag: "note:tag",
  noteExport: "note:export",
  vaultAdd: "vault:add",
  notebookAdd: "notebook:add",
  backupEncrypt: "backup:encrypt"
};

export const EVENTS = {
  userCheckStatus: "user:checkStatus",
  userSubscriptionUpdated: "user:subscriptionUpdated",
  userEmailConfirmed: "user:emailConfirmed",
  userLoggedIn: "user:loggedIn",
  userLoggedOut: "user:loggedOut",
  userFetched: "user:fetched",
  userSignedUp: "user:signedUp",
  userSessionExpired: "user:sessionExpired",
  databaseSyncRequested: "db:syncRequested",
  syncProgress: "sync:progress",
  syncCompleted: "sync:completed",
  syncItemMerged: "sync:itemMerged",
  syncAborted: "sync:aborted",
  syncCheckStatus: "sync:checkStatus",
  databaseUpdated: "db:updated",
  databaseCollectionInitiated: "db:collectionInitiated",
  appRefreshRequested: "app:refreshRequested",
  migrationProgress: "migration:progress",
  migrationStarted: "migration:start",
  migrationFinished: "migration:finished",
  noteRemoved: "note:removed",
  tokenRefreshed: "token:refreshed",
  userUnauthorized: "user:unauthorized",
  downloadCanceled: "file:downloadCanceled",
  uploadCanceled: "file:uploadCanceled",
  fileDownload: "file:download",
  fileUpload: "file:upload",
  fileDownloaded: "file:downloaded",
  fileUploaded: "file:uploaded",
  attachmentDeleted: "attachment:deleted",
  mediaAttachmentDownloaded: "attachments:mediaDownloaded",
  vaultLocked: "vault:locked",
  vaultUnlocked: "vault:unlocked",
  systemTimeInvalid: "system:invalidTime"
};

const separators = ["-", "/", "."];
const DD = "DD";
const MM = "MM";
const YYYY = "YYYY";
export const DATE_FORMATS = [
  ...[
    [DD, MM, YYYY],
    [MM, DD, YYYY],
    [YYYY, MM, DD]
  ]
    .map((item) => separators.map((sep) => item.join(sep)))
    .flat(),
  "MMM D, YYYY"
];

export const TIME_FORMATS = ["12-hour", "24-hour"];

export const CURRENT_DATABASE_VERSION = 6.1;

export const FREE_NOTEBOOKS_LIMIT = 20;
