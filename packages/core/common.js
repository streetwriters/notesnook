import EventManager from "./utils/event-manager";

export const EV = new EventManager();

export async function sendCheckUserStatusEvent(type) {
  const results = await EV.publishWithResult("user:checkStatus", type);
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
};
