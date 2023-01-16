/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

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
  const script = document.createElement("script");
  script.src = "/an.js";
  script.async = true;
  script.dataset.websiteId = "f16c07d9-c77b-4781-bfbd-f58e95640002";

  if (process.env.REACT_APP_PLATFORM !== "desktop")
    script.dataset.domains = "app.notesnook.com";
  script.dataset.autoTrack = "false";
  script.dataset.doNotTrack = "true";
  script.dataset.hostUrl = "https://analytics.streetwriters.co";
  const firstScriptElement = document.getElementsByTagName("script")[0];
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
    description: "Sent on startup"
  },
  checkoutStarted: {
    name: "checkout:started",
    description: "Sent when you start Paddle checkout."
  },
  offerClaimed: {
    name: "offer:claimed",
    description:
      "Sent when you start Paddle checkout with a coupon code applied."
  },
  announcementDismissed: {
    name: "announcement:dismissed",
    description: "Sent when you dismiss an announcement."
  },
  purchaseInitiated: {
    name: "purchase:initiated",
    description:
      "Sent whenever the Premium dialog is shown to you. This can be voluntary or via accessing a premium feature."
  },
  socialLink: {
    name: "link:social",
    description:
      "Sent whenever you open Notesnook social media link from the email verified screen."
  },
  announcementCta: {
    name: "announcement:cta",
    description: "Sent whenever you an announcement CTA is invoked."
  },
  accountCreated: {
    name: "/account/created",
    description: "Sent when you create an account.",
    type: "view"
  },
  signupSkipped: {
    name: "/signup/skipped",
    description: `Sent when you press "Jump to app" button on signup screen.`,
    type: "view"
  }
} as const;

export function trackEvent(event: TrackerEvent, eventMessage?: string) {
  if (Config.get("telemetry") === "false") return;
  if (!window.umami) return;
  if (event.type === "view") trackVisit(event.name);
  else if (eventMessage) window.umami.trackEvent(eventMessage, event.name);
}

export function trackVisit(url = "/") {
  if (Config.get("telemetry") === "false") return;
  const platform = getPlatform();
  if (!window.umami || !platform) return;

  window.umami.trackView(url, window.document.referrer);
  if (url === "/")
    trackEvent(
      ANALYTICS_EVENTS.version,
      `${appVersion.formatted}-${platform.toLowerCase()}`
    );
}
