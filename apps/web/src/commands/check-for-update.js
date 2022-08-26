import { EVENTS } from "@notesnook/desktop/events";
import { AppEventManager } from "../common/app-events";
import { isDesktop } from "../utils/platform";
import { appVersion, getServiceWorkerVersion } from "../utils/version";
import { invokeCommand } from "./index";

export default async function checkForUpdate() {
  if (isDesktop()) invokeCommand("checkForUpdate");
  else {
    AppEventManager.publish(EVENTS.checkingForUpdate);

    const registrations =
      (await navigator.serviceWorker?.getRegistrations()) || [];
    for (let registration of registrations) {
      await registration.update();
      if (registration.waiting) {
        const workerVersion = await getServiceWorkerVersion(
          registration.waiting
        );
        if (!workerVersion || workerVersion.numerical <= appVersion.numerical) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
          continue;
        }

        AppEventManager.publish(EVENTS.updateDownloadCompleted, {
          version: workerVersion.formatted
        });
        return;
      }
    }

    AppEventManager.publish(EVENTS.updateNotAvailable);
  }
}
