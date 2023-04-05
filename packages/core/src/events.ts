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

import { ValueOf } from "./types";

export const CHECK_IDS = {
  "note:color": "note:color",
  "note:tag": "note:tag",
  "note:export": "note:export",
  "vault:add": "vault:add",
  "notebook:add": "notebook:add",
  "backup:encrypt": "backup:encrypt",
  "database:sync": "database:sync"
} as const;

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
  databaseMigrated: "db:migrated",
  databaseUpdated: "db:updated",
  databaseCollectionInitiated: "db:collectionInitiated",
  appRefreshRequested: "app:refreshRequested",
  noteRemoved: "note:removed",
  tokenRefreshed: "token:refreshed",
  userUnauthorized: "user:unauthorized",
  attachmentsLoading: "attachments:loading",
  attachmentDeleted: "attachment:deleted",
  mediaAttachmentDownloaded: "attachments:mediaDownloaded",
  vaultLocked: "vault:locked",
  systemTimeInvalid: "system:invalidTime"
} as const;

export type EventMap = {
  [EVENTS.userCheckStatus]: UserCheckStatusEvent;
  // "user:subscriptionUpdated":
  // "user:emailConfirmed":
  // "user:loggedIn":
  // "user:loggedOut":
  // "user:fetched":
  // "user:signedUp":
  // "user:sessionExpired":
  // "db:syncRequested":
  // "db:migrated":
  [EVENTS.databaseUpdated]: DatabaseUpdatedEvent;
  // "app:refreshRequested":
  // "note:removed":
  // "token:refreshed":
  [EVENTS.attachmentsLoading]: AttachmentsProgressEvent;
  // "attachment:deleted":
  // "attachments:mediaDownloaded":
};

export type EventName = keyof EventMap;
export type Event = ValueOf<EventMap>;

export interface AttachmentsProgressEvent {
  type: "upload" | "download" | "encrypt";
  groupId?: string;
  total: number;
  current?: number;
}

export interface UserCheckStatusEvent {
  type: keyof typeof CHECK_IDS;
}

export interface DatabaseUpdatedEvent {
  op: "upsert" | "remove" | "delete";
  id: string;
}
