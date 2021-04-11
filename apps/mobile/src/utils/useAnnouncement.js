import {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {SUBSCRIPTION_STATUS} from '.';
import PremiumService from '../services/PremiumService';
import { db } from './DB';
import Storage from './storage';

var CACHED_ANNOUNCEMENT;
export default function useAnnouncement() {
  const [announcement, setAnnouncement] = useState();

  useEffect(() => {
    (async function () {
      try {
        CACHED_ANNOUNCEMENT = CACHED_ANNOUNCEMENT || (await db.announcement());
	
        if (
          !CACHED_ANNOUNCEMENT ||
          await Storage.read('removedAnnouncement') === CACHED_ANNOUNCEMENT.id ||
          !shouldShowAnnouncement(CACHED_ANNOUNCEMENT)
        )
          return;
  
        setAnnouncement(CACHED_ANNOUNCEMENT);
      } catch(e) {
        setAnnouncement()
      }
    

    })();
  }, []);

  const remove = useCallback(async () => {
    await Storage.write('removedAnnouncement', CACHED_ANNOUNCEMENT.id);
    setAnnouncement();
  }, [announcement]);
  return [announcement, remove];
}

const allowedPlatforms = ['all', 'mobile', Platform.OS];
function shouldShowAnnouncement(announcement) {
  let show = allowedPlatforms.indexOf(announcement.platform) > -1;
  console.log(show)
  if (!show) return;

  const subStatus = PremiumService.getUser()?.subscription?.type;

  switch (announcement.userType) {
    case 'pro':
      show = isUserPremium();
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
