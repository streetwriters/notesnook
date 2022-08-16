//@ts-ignore
import { Platform } from 'react-native';
import create, { State } from 'zustand';
import { APP_VERSION } from '../version';
import PremiumService from '../services/premium';
import { SUBSCRIPTION_STATUS } from '../utils/constants';
import { db } from '../common/database';
import { MMKV } from '../common/database/mmkv';
import layoutmanager from '../utils/layout-manager';
export interface MessageStore extends State {
  message: Message;
  setMessage: (message: Message) => void;
  announcements: Announcement[];
  setAnnouncement: () => Promise<void>;
  dialogs: Announcement[];
  remove: (id: string) => void;
}

export type Message = {
  visible: boolean;
  message: string | null;
  actionText: string | null;
  onPress: () => void;
  data: object;
  icon: string;
};

export type Action = {
  type: string;
  platforms: string[];
  title: string;
  data: string;
};
export type Style = {
  marginTop?: number;
  marginBottom?: number;
  textAlign?: 'center' | 'left' | 'right';
};
export type BodyItem = {
  type:
    | 'image'
    | 'title'
    | 'description'
    | 'body'
    | 'list'
    | 'features'
    | 'poll'
    | 'subheading'
    | 'shapes';
  src?: string;
  caption?: string;
  text?: string;
  style?: Style;
  items?: Array<{
    text?: string;
  }>;
};

export type Announcement = {
  type: 'dialog' | 'inline';
  body: BodyItem[];
  id: string;
  callToActions: Action[];
  timestamp: number;
  platforms: string[];
  isActive: boolean;
  userTypes: string[];
  appVersion: number;
};

export const useMessageStore = create<MessageStore>((set, get) => ({
  message: {
    visible: false,
    message: null,
    actionText: null,
    onPress: () => null,
    data: {},
    icon: 'account-outline'
  },
  setMessage: message => {
    console.log('setting message');
    setTimeout(() => {
      if (get().message.visible || message.visible) {
        layoutmanager.withAnimation();
      }

      set({ message: { ...message } });
    }, 1);
  },
  announcements: [],
  remove: async id => {
    MMKV.setItem(id, 'removed');

    const inlineCopy = get().announcements.slice();
    const dialogsCopy = get().dialogs.slice();
    const index = inlineCopy.findIndex(announcement => announcement.id === id);
    const dialogIndex = dialogsCopy.findIndex(dialog => dialog.id === id);

    if (index >= -1) {
      dialogsCopy.splice(dialogIndex, 1);
      inlineCopy.splice(index, 1);
    }
    set({ announcements: inlineCopy, dialogs: dialogsCopy });
  },
  dialogs: [],
  setAnnouncement: async function () {
    let announcements: Announcement[] = [];
    try {
      announcements = await db.announcements();
      if (!announcements) {
        announcements = [];
      }
    } catch (e) {
      console.log('ERROR', e);
      set({ announcements: [] });
    } finally {
      let all = await getFiltered(announcements);

      setTimeout(() => {
        if (all.filter(a => a.type === 'inline').length !== 0) {
          console.log('with setAnnouncement ');
          layoutmanager.withAnimation();
        }
        set({
          announcements: all.filter(a => a.type === 'inline'),
          dialogs: all.filter(a => a.type === 'dialog')
        });
      }, 1);
    }
  }
}));

const getFiltered = async (announcements: Announcement[]) => {
  if (!announcements) return [];
  let filtered: Announcement[] = [];
  for (let announcement of announcements) {
    if (await shouldShowAnnouncement(announcement)) {
      filtered.push(announcement);
    }
  }
  return filtered;
};

export const allowedPlatforms = ['all', 'mobile', Platform.OS];

async function shouldShowAnnouncement(announcement: Announcement) {
  if (!announcement) return false;
  let removed = (await MMKV.getStringAsync(announcement.id)) === 'removed';
  if (removed) return false;
  let show = announcement.platforms.some(platform => allowedPlatforms.indexOf(platform) > -1);

  if (announcement.appVersion) {
    return announcement.appVersion === APP_VERSION;
  }

  if (!show) return false;
  if (!show) return false;
  const user = (await db.user?.getUser()) as User;
  const subStatus = user?.subscription?.type || SUBSCRIPTION_STATUS.BASIC;
  show = announcement.userTypes.some(userType => {
    switch (userType) {
      case 'pro':
        return PremiumService.get();
      case 'trial':
        return subStatus === SUBSCRIPTION_STATUS.TRIAL;
      case 'trialExpired':
        return subStatus === SUBSCRIPTION_STATUS.BASIC;
      case 'loggedOut':
        return !user;
      case 'verified':
        return user?.isEmailConfirmed;
      case 'loggedIn':
        return !!user;
      case 'unverified':
        return !user?.isEmailConfirmed;
      case 'proExpired':
        return (
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED ||
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED
        );
      case 'any':
      default:
        return false;
    }
  });

  return show;
}
