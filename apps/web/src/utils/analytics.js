import Config from "./config";
import { getAppVersion } from "./useVersion";

export function trackEvent(eventName, eventType) {
  if (Config.get("telemetry") === "false") return;
  if (window.umami) {
    window.umami.trackEvent(eventName, eventType);
  }
}

export function trackVisit() {
  if (Config.get("telemetry") === "false") return;
  if (window.umami) {
    window.umami.trackView("/");
    trackEvent(getAppVersion().formatted, "version");
  }
}
