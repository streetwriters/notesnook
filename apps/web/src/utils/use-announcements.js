import { useCallback, useEffect, useState } from "react";
import { SUBSCRIPTION_STATUS } from "../common";
import { db } from "../common/db";
import Config from "./config";
import { isUserPremium } from "../hooks/use-is-user-premium";

var CACHED_ANNOUNCEMENTS = [];
var cancelled = false;
export default function useAnnouncements() {
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
      } finally {
        if (cancelled) return;
        let announcements = [];
        for (let announcement of CACHED_ANNOUNCEMENTS) {
          if (await shouldShowAnnouncement(announcement))
            announcements.push(announcement);
        }
        setAnnouncements(announcements);
      }
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
  return [announcements, remove];
}

export const allowedPlatforms = ["all", process.env.REACT_APP_PLATFORM];

async function shouldShowAnnouncement(announcement) {
  if (Config.get(announcement.id) === "removed") return false;

  let show = announcement.platforms.some(
    (platform) => allowedPlatforms.indexOf(platform) > -1
  );
  if (!show) return false;

  const user = await db.user.getUser();
  const subStatus = user?.subscription?.type;
  show = announcement.userTypes.some((userType) => {
    switch (userType) {
      case "pro":
        return isUserPremium();
      case "trial":
        return subStatus === SUBSCRIPTION_STATUS.TRIAL;
      case "trialExpired":
        return subStatus === SUBSCRIPTION_STATUS.BASIC;
      case "loggedOut":
        return !user;
      case "loggedIn":
        return !!user;
      case "unverified":
        return user && !user.isEmailVerified;
      case "verified":
        return user && user.isEmailVerified;
      case "proExpired":
        return subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED;
      case "any":
      default:
        return true;
    }
  });

  return show;
}
