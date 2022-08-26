import { AppEventManager } from "../common/app-events";
import { isDesktop } from "../utils/platform";

export function invokeCommand(type, payload = {}) {
  if (!isDesktop()) return;

  window.api.send("fromRenderer", {
    type,
    ...payload
  });
}

if (isDesktop()) {
  window.api.receive("fromMain", (args) => {
    console.log(args);
    const { type } = args;
    AppEventManager.publish(type, args);
  });
}
