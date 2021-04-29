import { useCallback, useEffect, useState } from "react";
import { isUserPremium, SUBSCRIPTION_STATUS } from "../common";
import { db } from "../common/db";
import Config from "./config";
import { store as userstore } from "../stores/user-store";

var CACHED_ANNOUNCEMENT;
export default function useAnnouncement() {
  const [announcement, setAnnouncement] = useState();

  useEffect(() => {
    (async function () {
      try {
        CACHED_ANNOUNCEMENT = CACHED_ANNOUNCEMENT || (await db.announcement());
      } catch (e) {
        console.error(e);
      } finally {
        if (
          !CACHED_ANNOUNCEMENT ||
          Config.get(CACHED_ANNOUNCEMENT.id) ||
          !shouldShowAnnouncement(CACHED_ANNOUNCEMENT)
        )
          return;
        setAnnouncement(CACHED_ANNOUNCEMENT);
      }
    })();
  }, []);

  const remove = useCallback(() => {
    Config.set(announcement.id, "removed");
    setAnnouncement();
  }, [announcement]);
  return [announcement, remove];
}

const allowedPlatforms = ["all", process.env.REACT_APP_PLATFORM];
function shouldShowAnnouncement(announcement) {
  let show = allowedPlatforms.indexOf(announcement.platform) > -1;
  if (!show) return;

  const subStatus = userstore.get().user?.subscription?.type;
  switch (announcement.userType) {
    case "pro":
      show = isUserPremium();
      break;
    case "trial":
      show = subStatus === SUBSCRIPTION_STATUS.TRIAL;
      break;
    case "trialExpired":
      show = subStatus === SUBSCRIPTION_STATUS.BASIC;
      break;
    case "loggedOut":
      show = !userstore.get().isLoggedIn;
      break;
    case "loggedIn":
      show = userstore.get().isLoggedIn;
      break;
    case "unverified":
      show = !userstore.get().user?.isEmailVerified;
      break;
    case "verified":
      show = userstore.get().user?.isEmailVerified;
      break;
    case "proExpired":
      show =
        subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED ||
        subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELED;
      break;
    case "any":
    default:
      break;
  }

  return show;
}
