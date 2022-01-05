import { isDesktop } from "../utils/platform";
import { invokeCommand } from "./index";

export default async function downloadUpdate() {
  if (isDesktop()) invokeCommand("downloadUpdate");
  else {
    console.log("Force updating");
    if (!("serviceWorker" in navigator)) return;
    const registration = await navigator.serviceWorker.ready;
    await registration.update();
  }
}
