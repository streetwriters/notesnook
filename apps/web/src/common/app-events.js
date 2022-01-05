import EventManager from "notes-core/utils/eventmanager";

export const AppEventManager = new EventManager();
export const AppEvents = {
  UPDATE_ATTACHMENT_PROGRESS: "updateAttachmentProgress",
  UPDATE_WORD_COUNT: "updateWordCount",
  UPDATE_STATUS: "updateStatus",
  REMOVE_STATUS: "removeStatus",
};
