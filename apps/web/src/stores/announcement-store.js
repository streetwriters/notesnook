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

import createStore from "../common/store";
import { db } from "../common/db";
import BaseStore from "./index";
import Config from "../utils/config";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { SUBSCRIPTION_STATUS } from "../common/constants";
import { appVersion } from "../utils/version";
import { findItemAndDelete } from "@notesnook/core";

/**
 * @extends {BaseStore<AnnouncementStore>}
 */
class AnnouncementStore extends BaseStore {
  inlineAnnouncements = [];
  dialogAnnouncements = [];

  refresh = async () => {
    if (IS_TESTING) return;

    try {
      const inlineAnnouncements = [];
      const dialogAnnouncements = [];
      for (let announcement of await db.announcements()) {
        if (!(await shouldShowAnnouncement(announcement))) continue;
        if (announcement.type === "inline")
          inlineAnnouncements.push(announcement);
        else if (announcement.type === "dialog")
          dialogAnnouncements.push(announcement);
      }
      this.set((state) => {
        state.inlineAnnouncements = inlineAnnouncements;
        state.dialogAnnouncements = dialogAnnouncements;
      });
    } catch (e) {
      console.error(e);
    }
  };

  dismiss = (id) => {
    Config.set(id, "removed");
    this.set((state) => {
      findItemAndDelete(
        state.inlineAnnouncements,
        (announcement) => announcement.id === id
      );

      findItemAndDelete(
        state.dialogAnnouncements,
        (announcement) => announcement.id === id
      );
    });
  };
}

const [useStore, store] = createStore(
  (set, get) => new AnnouncementStore(set, get)
);
export { useStore, store };

export const allowedPlatforms = [
  "all",
  PLATFORM,
  ...(window.os ? [window.os()] : [])
];

async function shouldShowAnnouncement(announcement) {
  if (Config.get(announcement.id) === "removed") return false;

  let show = announcement.platforms.some(
    (platform) => allowedPlatforms.indexOf(platform) > -1
  );
  if (!show) return false;

  show =
    !announcement.appVersion ||
    announcement.appVersion === appVersion.numerical;

  if (!show) return false;

  const user = await db.user.getUser();
  const subStatus = user?.subscription?.type;
  show = announcement.userTypes.some((userType) => {
    switch (userType) {
      case "pro":
        return isUserPremium(user);
      case "trial":
        return subStatus === SUBSCRIPTION_STATUS.TRIAL;
      case "trialExpired":
        return subStatus === SUBSCRIPTION_STATUS.BASIC;
      case "loggedOut":
        return !user;
      case "loggedIn":
        return !!user;
      case "unverified":
        return user && !user.isEmailConfirmed;
      case "verified":
        return user && user.isEmailConfirmed;
      case "proExpired":
        return subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED;
      case "any":
      default:
        return true;
    }
  });

  return show;
}
