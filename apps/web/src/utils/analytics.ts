import Config from "./config";
import { getPlatform } from "./platform";
import { appVersion } from "./version";

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
  if (Config.get("telemetry") === "false") return;
  var script = document.createElement("script");
  script.src = "/an.js";
  script.async = true;
  script.dataset.websiteId = "f16c07d9-c77b-4781-bfbd-f58e95640002";

  if (process.env.REACT_APP_PLATFORM !== "desktop")
    script.dataset.domains = "app.notesnook.com";
  script.dataset.autoTrack = "false";
  script.dataset.doNotTrack = "true";
  script.dataset.hostUrl = "https://analytics.streetwriters.co";
  var firstScriptElement = document.getElementsByTagName("script")[0];
  script.onload = function () {
    trackVisit();
  };
  firstScriptElement.parentNode?.insertBefore(script, firstScriptElement);
}

type TrackerEvent = {
  name: string;
  description: string;
  type?: "event" | "view";
};

export const ANALYTICS_EVENTS = {
  version: {
    name: "version",
    description: "Sent on startup",
  },
  checkoutStarted: {
    name: "checkout:started",
    description: "Sent when you start Paddle checkout.",
  },
  offerClaimed: {
    name: "offer:claimed",
    description:
      "Sent when you start Paddle checkout with a coupon code applied.",
  },
  announcementDismissed: {
    name: "announcement:dismissed",
    description: "Sent when you dismiss an announcement.",
  },
  purchaseInitiated: {
    name: "purchase:initiated",
    description:
      "Sent whenever the Premium dialog is shown to you. This can be voluntary or via accessing a premium feature.",
  },
  socialLink: {
    name: "link:social",
    description:
      "Sent whenever you open Notesnook social media link from the email verified screen.",
  },
  announcementCta: {
    name: "announcement:cta",
    description: "Sent whenever you an announcement CTA is invoked.",
  },
  accountCreated: {
    name: "/account/created",
    description: "Sent when you create an account.",
    type: "view",
  },
} as const;

export function trackEvent(event: TrackerEvent, eventMessage?: string) {
  if (Config.get("telemetry") === "false") return;
  if (!window.umami) return;
  if (event.type === "view") trackVisit(event.name);
  else if (eventMessage) window.umami.trackEvent(eventMessage, event.name);
}

export function trackVisit(url: string = "/") {
  if (Config.get("telemetry") === "false") return;
  const platform = getPlatform();
  if (!window.umami || !platform) return;

  window.umami.trackView(url);
  if (url === "/")
    trackEvent(
      ANALYTICS_EVENTS.version,
      `${appVersion.formatted}-${platform.toLowerCase()}`
    );
}
