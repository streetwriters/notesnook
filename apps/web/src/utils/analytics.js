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

export const ANALYTICS_EVENTS = {
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
};

export function trackEvent(event, eventMessage) {
  if (Config.get("telemetry") === "false") return;
  if (window.umami) {
    window.umami.trackEvent(eventMessage, event.name);
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
