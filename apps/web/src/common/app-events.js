import EventManager from "@streetwriters/notesnook-core/utils/event-manager";

export const AppEventManager = new EventManager();
export const AppEvents = {
  UPDATE_ATTACHMENT_PROGRESS: "updateAttachmentProgress",
  UPDATE_STATUS: "updateStatus",
  REMOVE_STATUS: "removeStatus"
};
