import Config from "./config";

export function trackEvent(eventName, eventType) {
  if (Config.get("telemetry") === "false") return;
  if (window.umami) {
    window.umami.trackEvent(eventName, eventType);
  }
}
