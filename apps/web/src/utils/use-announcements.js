import { useCallback, useEffect, useState } from "react";
import { isUserPremium, SUBSCRIPTION_STATUS } from "../common";
import { db } from "../common/db";
import Config from "./config";
import { store as userstore } from "../stores/user-store";

var CACHED_ANNOUNCEMENTS = [];
export default function useAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    (async function () {
      try {
        CACHED_ANNOUNCEMENTS =
          CACHED_ANNOUNCEMENTS || (await db.announcements());
      } catch (e) {
        console.error(e);
      } finally {
        setAnnouncements((announcements) => {
          const filtered = announcements.filter((announcement) =>
            shouldShowAnnouncement(announcement)
          );
          return filtered;
        });
      }
    })();
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

function shouldShowAnnouncement(announcement) {
  if (Config.get(announcement.id) === "removed") return false;

  let show = announcement.platforms.some(
    (platform) => allowedPlatforms.indexOf(platform) > -1
  );
  if (!show) return false;

  const subStatus = userstore.get().user?.subscription?.type;
  show = announcement.userTypes.some((userType) => {
    switch (userType) {
      case "pro":
        return isUserPremium();
      case "trial":
        return subStatus === SUBSCRIPTION_STATUS.TRIAL;
      case "trialExpired":
        return subStatus === SUBSCRIPTION_STATUS.BASIC;
      case "loggedOut":
        return !userstore.get().isLoggedIn;
      case "loggedIn":
        return userstore.get().isLoggedIn;
      case "unverified":
        return !userstore.get().user?.isEmailVerified;
      case "verified":
        return userstore.get().user?.isEmailVerified;
      case "proExpired":
        return (
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED ||
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELED
        );
      case "any":
      default:
        return true;
    }
  });

  return show;
}
