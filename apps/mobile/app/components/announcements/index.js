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

import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { DDS } from "../../services/device-detection";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import { useMessageStore } from "../../stores/use-message-store";
import { useThemeColors } from "@notesnook/theme";
import {
  eCloseAnnouncementDialog,
  eOpenAnnouncementDialog
} from "../../utils/events";
import BaseDialog from "../dialog/base-dialog";
import { allowedOnPlatform, renderItem } from "./functions";
import { useCallback } from "react";

/**
 * Test announcement
 * {
    id: "some-announcement",
    type: "dialog",
    body: [
      {
        type: "title",
        text: "This is a title",
        platforms: ["all"]
      },
      {
        type: "description",
        text: "Most of you are too busy to keep up to date with what's happening in Notesnook. That is unfortunate because Notesnook has come a looooong way.",
        style: {
          marginBottom: 1
        },
        platforms: ["all"]
      },
      {
        type: "description",
        text: "To solve this, we are launching the Notesnook Digest — a newsletter to help you stay updated about Notesnook development. And to keep things interesting I'll also sprinkle this newsletter with other interesting stuff like privacy tips & news, interesting books, things I am looking forward to etc.",
        style: {
          marginBottom: 1
        },
        platforms: ["all"]
      },
      {
        type: "description",
        text: "So be sure to subscribe. There won't be a proper schedule to this (yet) maybe once or twice a month. I promise no spam — only more awesomeness.",
        style: {
          marginBottom: 1
        },
        platforms: ["all"]
      },
      {
        type: "description",
        text: "— May privacy reign.",
        style: {
          marginBottom: 1
        },
        platforms: ["all"]
      },
      {
        type: "callToActions",
        actions: [
          {
            type: "promo",
            title: "15% Off",
            platforms: ["android"],
            data: "com.streetwriters.notesnook.sub.yr.15"
          }
        ],
        platforms: ["all"]
      }
    ]
  }
 */

export const AnnouncementDialog = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState();
  const remove = useMessageStore((state) => state.remove);

  useEffect(() => {
    eSubscribeEvent(eOpenAnnouncementDialog, open);
    eSubscribeEvent(eCloseAnnouncementDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenAnnouncementDialog, open);
      eUnSubscribeEvent(eCloseAnnouncementDialog, close);
    };
  }, [close, visible]);

  const open = (data) => {
    setInfo(data);
    setImmediate(() => {
      setVisible(true);
    });
  };

  const close = useCallback(() => {
    if (visible) {
      remove(info?.id);
      setInfo(null);
      setVisible(false);
    }
  }, [info?.id, remove, visible]);

  return (
    <BaseDialog
      animated={false}
      centered={false}
      bottom={true}
      onRequestClose={close}
      visible={visible}
    >
      <View
        style={{
          width: DDS.isTab ? 600 : "100%",
          backgroundColor: colors.primary.background,
          maxHeight: DDS.isTab ? "90%" : "100%",
          borderRadius: DDS.isTab ? 10 : 0,
          overflow: "hidden",
          marginBottom: DDS.isTab ? 20 : 0,
          borderTopRightRadius: 10,
          borderTopLeftRadius: 10
        }}
      >
        <FlatList
          style={{
            width: "100%"
          }}
          data={info?.body.filter((item) => allowedOnPlatform(item.platforms))}
          renderItem={renderItem}
        />

        <View
          style={{
            height: 15
          }}
        />
      </View>
    </BaseDialog>
  );
};
