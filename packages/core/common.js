import EventManager from "./utils/event-manager";

export const EV = new EventManager();

export async function sendCheckUserStatusEvent(type) {
  const results = await EV.publishWithResult(EVENTS.userCheckStatus, type);
  if (typeof results === "boolean") return results;
  return results.some((r) => r.type === type && r.result === true);
}

export const CHECK_IDS = {
  noteColor: "note:color",
  noteTag: "note:tag",
  noteExport: "note:export",
  vaultAdd: "vault:add",
  notebookAdd: "notebook:add",
  backupEncrypt: "backup:encrypt",
  databaseSync: "database:sync",
};

export const EVENTS = {
  userCheckStatus: "user:checkStatus",
  userSubscriptionUpdated: "user:subscriptionUpdated",
  userEmailConfirmed: "user:emailConfirmed",
  userLoggedIn: "user:loggedIn",
  userLoggedOut: "user:loggedOut",
  userFetched: "user:fetched",
  databaseSyncRequested: "db:syncRequested",
  databaseMigrated: "db:migrated",
  databaseUpdated: "db:updated",
  appRefreshRequested: "app:refreshRequested",
  noteRemoved: "note:removed",
};

export const CURRENT_DATABASE_VERSION = 5.2;
