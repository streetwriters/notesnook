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

export const AnnouncementDialog = () => {
  const { colors } = useThemeColors();
  const [visible, setVisible] = useState(false);
  const [info, setInfo] = useState(null);
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
    setVisible(true);
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
