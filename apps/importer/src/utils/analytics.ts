import { useEffect, useState } from "react";
import Config from "./config";

declare global {
  interface Window {
    umami?: {
      trackEvent: (
        value: string,
        type: string,
        url?: string,
        websiteId?: string
      ) => void;
      trackView: (url: string, referrer?: string, websiteId?: string) => void;
    };
  }
}

export function loadTrackerScript() {
  if (Config.get("telemetry") === "false") return Promise.resolve(false);
  if (!!document.getElementById("analytics")) {
    return Promise.resolve(true);
  }

  var script = document.createElement("script");
  script.id = "analytics";
  script.src = "https://analytics.streetwriters.co/umami.js";
  script.async = true;
  script.dataset.websiteId = "b84b000d-9fcb-48e3-bbc0-0adad1a960c0";

  if (process.env.REACT_APP_PLATFORM !== "desktop")
    script.dataset.domains = "importer.notesnook.com";
  script.dataset.autoTrack = "false";
  script.dataset.doNotTrack = "true";
  script.dataset.hostUrl = "https://analytics.streetwriters.co";

  return new Promise<boolean>((resolve, reject) => {
    script.onload = () => resolve(true);
    script.onerror = (e) => reject(e);

    var firstScriptElement = document.getElementsByTagName("script")[0];
    firstScriptElement.parentNode?.insertBefore(script, firstScriptElement);
  });
}

type TrackerEvent = {
  name: string;
  // description: string;
  type?: "event" | "view";
};

export async function trackEvent(event: TrackerEvent, eventMessage?: string) {
  if (
    !(await loadTrackerScript()) ||
    !Config.get("telemetry", true) ||
    !window.umami
  )
    return;

  if (event.type === "view") trackVisit(event.name);
  else if (eventMessage) window.umami.trackEvent(eventMessage, event.name);
}

function trackVisit(url: string = "/") {
  window.umami?.trackView(url, window.document.referrer);
}

export function useTelemetry() {
  const [isEnabled, setIsEnabled] = useState(Config.get("telemetry", true));

  useEffect(() => {
    Config.set("telemetry", isEnabled);
  }, [isEnabled]);

  return { isEnabled, setIsEnabled };
}
