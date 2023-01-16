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

import { Platform } from "react-native";
import { MMKV } from "../database/mmkv";
import { useSettingStore } from "../../stores/use-setting-store";

const WEBSITE_ID = "3c6890ce-8410-49d5-8831-15fb2eb28a21";
const baseUrl = "https://analytics.streetwriters.co/api/collect";

const UA =
  Platform.OS === "ios"
    ? "Mozilla/5.0 (iPhone; CPU iPhone OS 12_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.0 Mobile/15E148 Safari/604.1"
    : `
Mozilla/5.0 (Linux; Android 8.0.0; SM-G960F Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.84 Mobile Safari/537.36`;

/**
 *
 * @param {Routes} route
 * @param {Routes[]} conditions
 * @returns
 */
async function canUpdateAnalytics(route, conditions = []) {
  if (!useSettingStore?.getState()?.settings?.telemetry) return false;
  let eventsList = MMKV.getString("notesnookUserEvents");

  if (eventsList) {
    eventsList = JSON.parse(eventsList);
  }

  if (eventsList && eventsList[route]) {
    console.log("analytics: event already sent", route);
    return false;
  }
  if (route !== "/welcome") {
    for (let cond of conditions) {
      if (!eventsList || !eventsList[cond]) {
        console.log("analytics: conditions not met for event", route, cond);
        return false;
      }
    }
  }
  console.log("analytics: will send event", route);
  return true;
}

async function saveAnalytics(route, value = true) {
  let eventsList = MMKV.getString("notesnookUserEvents");
  if (eventsList) {
    eventsList = JSON.parse(eventsList);
  } else {
    eventsList = {};
  }
  eventsList[route] = value;
  MMKV.setString("notesnookUserEvents", JSON.stringify(eventsList));
}

/**
 *@typedef {"/welcome" | "/home" | "/signup" | "/first-note" | "/account-created" | "/pro-sheet" | "/pro-plans" | "/iap-native" | "/pro-screen" | "/editor" | "/editor-toolbar" | "/properties" | "/sidemenu"} Routes
 * @param {Routes} prevRoute
 * @param {Routes} route
 * @param {Routes[]} conditions
 * @param {boolean} once
 * @returns
 */

async function pageView(
  route,
  prevRoute = "",
  conditions = ["/welcome"],
  once = true
) {
  if (__DEV__) return;
  if (!(await canUpdateAnalytics(route, conditions)) && once) return;
  let body = {
    payload: {
      website: WEBSITE_ID,
      url: `notesnook-${Platform.OS}${prevRoute}${route}`,
      referrer: `https://notesnook.com/notesnook-${Platform.OS}${prevRoute}`,
      hostname: `notesnook-${Platform.OS}`,
      language: "en-US",
      screen: "1920x1080"
    },
    type: "pageview"
  };

  try {
    let response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA
      },
      body: JSON.stringify(body)
    });
    console.log("analytics: event sent", route);
    await saveAnalytics(route);
    return await response.text();
  } catch (e) {
    console.log(e);
  }
}

async function sendEvent(type, value, once = true) {
  if (__DEV__) return;
  if (!(await canUpdateAnalytics(type)) && once) return;
  let body = {
    payload: {
      website: WEBSITE_ID,
      url: "/",
      event_type: type,
      event_value: value,
      hostname: "notesnook-android-app",
      language: "en-US",
      screen: "1920x1080"
    },
    type: "event"
  };

  try {
    let response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": UA
      },
      body: JSON.stringify(body)
    });
    console.log(response.status);
    return await response.text();
  } catch (e) {
    console.log(e);
  }
}

export default {
  sendEvent,
  pageView,
  saveAnalytics
};
