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

import Clipboard from "@react-native-clipboard/clipboard";
import React from "react";
import { View } from "react-native";
import { db } from "../../common/database";
import { ToastEvent } from "../../services/event-manager";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
export const DevMode = ({ item }) => {
  const devMode = useSettingStore((state) => state.settings.devMode);

  return devMode ? (
    <View
      style={{
        width: "100%",
        paddingHorizontal: 12,
        marginTop: 10
      }}
    >
      <Button
        onPress={async () => {
          let additionalData = {};
          if (item.type === "note") {
            let content = await db.content.raw(item.contentId);
            if (content) {
              content = db.debug.strip(content);
              additionalData.content = content;
            }
          }
          additionalData.lastSynced = await db.lastSynced();
          let _note = { ...item };
          _note.additionalData = additionalData;
          Clipboard.setString(db.debug.strip(_note));

          ToastEvent.show({
            heading: "Debug data copied!",
            type: "success",
            context: "local"
          });
        }}
        fontSize={SIZE.sm}
        title="Copy debug data"
        icon="clipboard"
        height={30}
        type="warn"
        style={{
          alignSelf: "flex-end"
        }}
      />
    </View>
  ) : null;
};
