import { isDesktop } from "../utils/platform";
import { invokeCommand } from "./index";

export default async function installUpdate() {
  if (isDesktop()) invokeCommand("installUpdate");
  else {
    const registrations =
      (await navigator.serviceWorker?.getRegistrations()) || [];
    let reload = false;
    for (let registration of registrations) {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
        reload = true;
      }
    }
    if (reload) window.location.reload();
  }
}
