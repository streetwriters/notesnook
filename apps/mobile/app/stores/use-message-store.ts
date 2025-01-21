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

import { User } from "@notesnook/core";
import { Platform } from "react-native";
import { getVersion } from "react-native-device-info";
import create, { State } from "zustand";
import { db } from "../common/database";
import { MMKV } from "../common/database/mmkv";
import PremiumService from "../services/premium";
import { SUBSCRIPTION_STATUS } from "../utils/constants";
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
  type?: string;
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
  textAlign?: "center" | "left" | "right";
};
export type BodyItem = {
  type:
    | "image"
    | "title"
    | "description"
    | "body"
    | "list"
    | "features"
    | "poll"
    | "subheading"
    | "shapes";
  src?: string;
  caption?: string;
  text?: string;
  style?: Style;
  items?: Array<{
    text?: string;
  }>;
};

export type Announcement = {
  type: "dialog" | "inline";
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
    icon: "account-outline",
    type: ""
  },
  setMessage: (message) => {
    set({ message: { ...message } });
  },
  announcements: [],
  remove: async (id) => {
    MMKV.setItem(id, "removed");

    const inlineCopy = get().announcements.slice();
    const dialogsCopy = get().dialogs.slice();
    const index = inlineCopy.findIndex(
      (announcement) => announcement.id === id
    );
    const dialogIndex = dialogsCopy.findIndex((dialog) => dialog.id === id);

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
      set({ announcements: [] });
    } finally {
      const all = await getFiltered(announcements);

      setTimeout(() => {
        set({
          announcements: all.filter((a) => a.type === "inline"),
          dialogs: all.filter((a) => a.type === "dialog")
        });
      }, 1);
    }
  }
}));

const getFiltered = async (announcements: Announcement[]) => {
  if (!announcements) return [];
  const filtered: Announcement[] = [];
  for (const announcement of announcements) {
    if (await shouldShowAnnouncement(announcement)) {
      filtered.push(announcement);
    }
  }
  return filtered;
};

export const allowedPlatforms = ["all", "mobile", Platform.OS];

async function shouldShowAnnouncement(announcement: Announcement) {
  if (!announcement) return false;
  const removed = (await MMKV.getStringAsync(announcement.id)) === "removed";
  if (removed) return false;
  let show = announcement.platforms.some(
    (platform) => allowedPlatforms.indexOf(platform) > -1
  );

  if (announcement.appVersion) {
    return announcement.appVersion === (getVersion() as unknown as number);
  }

  if (!show) return false;
  if (!show) return false;
  const user = (await db.user?.getUser()) as User;
  const subStatus = user?.subscription?.type || SUBSCRIPTION_STATUS.BASIC;
  show = announcement.userTypes.some((userType) => {
    switch (userType) {
      case "pro":
        return PremiumService.get();
      case "trial":
        return subStatus === SUBSCRIPTION_STATUS.TRIAL;
      case "trialExpired":
        return subStatus === SUBSCRIPTION_STATUS.BASIC;
      case "loggedOut":
        return !user;
      case "verified":
        return user?.isEmailConfirmed;
      case "loggedIn":
        return !!user;
      case "unverified":
        return !user?.isEmailConfirmed;
      case "proExpired":
        return (
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_EXPIRED ||
          subStatus === SUBSCRIPTION_STATUS.PREMIUM_CANCELLED
        );
      case "any":
      default:
        return false;
    }
  });

  return show;
}
