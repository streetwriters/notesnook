import EventManager from "notes-core/utils/eventmanager";
import { isDesktop } from "../utils/platform";

export const ElectronEventManager = new EventManager();

export function invokeCommand(type, payload = {}) {
  if (!isDesktop()) return;

  window.api.send("fromRenderer", {
    type,
    ...payload,
  });
}

if (isDesktop()) {
  window.api.receive("fromMain", (args) => {
    const { type } = args;
    ElectronEventManager.publish(type, args);
  });
}
