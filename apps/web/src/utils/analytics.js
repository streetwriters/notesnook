import Config from "./config";
import { getPlatform } from "./platform";
import { getAppVersion } from "./useVersion";

export function loadTrackerScript() {
  if (Config.get("telemetry") === "false") return;
  var script = document.createElement("script");
  script.src = "https://analytics.streetwriters.co/umami.js";
  script.async = true;
  script.dataset.websiteId = "f16c07d9-c77b-4781-bfbd-f58e95640002";

  if (process.env.REACT_APP_PLATFORM !== "desktop")
    script.dataset.domains = "app.notesnook.com";
  script.dataset.autoTrack = "false";
  script.dataset.doNotTrack = "true";
  var firstScriptElement = document.getElementsByTagName("script")[0];
  script.onload = function () {
    trackVisit();
  };
  firstScriptElement.parentNode.insertBefore(script, firstScriptElement);
}

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
    trackEvent(
      `${getAppVersion().formatted}-${getPlatform().toLowerCase()}`,
      "version"
    );
  }
}
