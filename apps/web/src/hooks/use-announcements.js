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

import { useCallback, useEffect, useState } from "react";
import { SUBSCRIPTION_STATUS } from "../common/constants";
import { db } from "../common/db";
import Config from "../utils/config";
import { isUserPremium } from "../hooks/use-is-user-premium";
import { appVersion } from "../utils/version";

var CACHED_ANNOUNCEMENTS = [];
var cancelled = false;
/**
 *
 * @param {"inline"|"dialog"} type
 * @returns
 */
export default function useAnnouncements(type = "inline") {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async function () {
      cancelled = false;
      try {
        CACHED_ANNOUNCEMENTS = CACHED_ANNOUNCEMENTS.length
          ? CACHED_ANNOUNCEMENTS
          : await db.announcements();
      } catch (e) {
        console.error(e);
      }

      if (cancelled) return;
      let announcements = [];
      for (let announcement of CACHED_ANNOUNCEMENTS) {
        if (!(await shouldShowAnnouncement(announcement))) continue;
        announcements.push(announcement);
      }
      setAnnouncements(announcements);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const remove = useCallback((id) => {
    Config.set(id, "removed");
    setAnnouncements((announcements) => {
      const copy = announcements.slice();
      const index = copy.findIndex((announcement) => announcement.id === id);
      if (index <= -1) return copy;
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  return [announcements.filter((a) => a.type === type), remove];
}

export const allowedPlatforms = [
  "all",
  process.env.REACT_APP_PLATFORM,
  window.os
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
