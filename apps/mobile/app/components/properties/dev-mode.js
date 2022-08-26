import Clipboard from "@react-native-clipboard/clipboard";
import React from "react";
import { View } from "react-native";
import { useSettingStore } from "../../stores/use-setting-store";
import { ToastEvent } from "../../services/event-manager";
import { db } from "../../common/database";
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
