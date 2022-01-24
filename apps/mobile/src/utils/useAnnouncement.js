import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { SUBSCRIPTION_STATUS } from '.';
import PremiumService from '../services/PremiumService';
import { db } from './database';
import { MMKV } from './mmkv';

var CACHED_ANNOUNCEMENT;
export default function useAnnouncement() {
  const [announcement, setAnnouncement] = useState(CACHED_ANNOUNCEMENT);

  useEffect(() => {
    (async function () {
      try {
        CACHED_ANNOUNCEMENT = CACHED_ANNOUNCEMENT || (await db.announcement());
        if (
          !CACHED_ANNOUNCEMENT ||
          (await MMKV.getStringAsync('removedAnnouncement')) === CACHED_ANNOUNCEMENT.id ||
          !shouldShowAnnouncement(CACHED_ANNOUNCEMENT)
        ) {
          CACHED_ANNOUNCEMENT = null;
          return;
        }
        setAnnouncement(CACHED_ANNOUNCEMENT);
      } catch (e) {
        setAnnouncement(null);
      }
    })();
  }, []);

  const remove = useCallback(async () => {
    await MMKV.setStringAsync('removedAnnouncement', CACHED_ANNOUNCEMENT.id);
    CACHED_ANNOUNCEMENT = null;
    setAnnouncement(null);
  }, [announcement]);
  return [announcement, remove];
}

const allowedPlatforms = ['all', 'mobile', Platform.OS];
function shouldShowAnnouncement(announcement) {
  let show = allowedPlatforms.indexOf(announcement.platform) > -1;
  console.log(show);
  if (!show) return;

  const subStatus = PremiumService.getUser()?.subscription?.type;

  switch (announcement.userType) {
    case 'pro':
      show = PremiumService.get() && subStatus !== SUBSCRIPTION_STATUS.TRIAL;
      break;
    case 'trial':
      show = subStatus === SUBSCRIPTION_STATUS.TRIAL;
      break;
    case 'trialExpired':
      show = subStatus === SUBSCRIPTION_STATUS.BASIC;
      break;
    case 'loggedOut':
      show = !PremiumService.getUser();
      break;
    case 'verified':
      show = PremiumService.getUser()?.isEmailVerified;
      break;
    case 'loggedIn':
      show = !!PremiumService.getUser();
      break;
    case 'unverified':
      show = !PremiumService.getUser()?.isEmailVerified;
      break;
    case 'proExpired':
      show =
        subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED ||
        subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELED;
      break;
    case 'any':
    default:
      break;
  }

  return show;
}
