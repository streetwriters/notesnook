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

import { getPlatform } from "./platform";
import { isTelemetryEnabled } from "./telemetry";
import { appVersion } from "./version";

type PageView = {
  type: "pageview";
  referrer: string;
  url?: string;
};

type Event = {
  type: "event";
  event_name: string;
  event_data: Record<string, unknown>;
};

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
  }
} as const;

const baseUrl = `https://analytics.streetwriters.co/api/collect`;

async function trackUmamiView(url: string, referrer?: string) {
  return collect({
    type: "pageview",
    referrer: referrer || window.document.referrer,
    url
  });
}

function trackUmamiEvent(name: string, data: Record<string, unknown>) {
  return collect({
    type: "event",
    event_name: name,
    event_data: data
  });
}

async function collect(event: PageView | Event) {
  const {
    screen: { width, height },
    navigator: { language },
    location: { hostname, pathname, search }
  } = window;

  const screen = `${width}x${height}`;
  const currentUrl =
    (event.type === "pageview" && event.url) || `${pathname}${search}`;

  const body = {
    payload: {
      website: `f16c07d9-c77b-4781-bfbd-f58e95640002`,
      hostname,
      screen,
      language,
      url: currentUrl,
      ...event
    },
    type: event.type
  };

  try {
    await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      keepalive: true
    });
  } catch (e) {
    console.error(e);
  }
}

export function trackEvent(
  event: TrackerEvent,
  data?: Record<string, unknown>
) {
  if (!isTelemetryEnabled()) return;
  if (event.type === "view") trackVisit(event.name);
  else if (data) trackUmamiEvent(event.name, data);
}

export function trackVisit(url = "/") {
  if (!isTelemetryEnabled()) return;

  const platform = getPlatform();
  if (!platform) return;

  trackUmamiView(window.document.referrer);
  if (url === "/")
    trackEvent(ANALYTICS_EVENTS.version, {
      version: appVersion.formatted,
      platform
    });
}

if (isTelemetryEnabled()) {
  document.addEventListener("readystatechange", () => {
    trackVisit();
  });
}
