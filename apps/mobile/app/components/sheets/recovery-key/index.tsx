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

import { sanitizeFilename } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useRef, useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import FileViewer from "react-native-file-viewer";
import * as ScopedStorage from "react-native-scoped-storage";
import Share from "react-native-share";
import { Radius, Spacing } from "../../../common/design/spacing";
import { db } from "../../../common/database";
import filesystem from "../../../common/filesystem";
import { presentSheet, ToastManager } from "../../../services/event-manager";
import { clearMessage } from "../../../services/message";
import SettingsService from "../../../services/settings";
import { AppFontSize } from "../../../utils/size";
import { Button } from "../../ui/button";
import AppIcon from "../../ui/AppIcon";
import { Pressable } from "../../ui/pressable";
import { QRCode } from "../../ui/svg/lazy";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { User } from "@notesnook/core";
import { CameraRoll } from "@react-native-camera-roll/camera-roll";
import { useSettingStore } from "../../../stores/use-setting-store";

type RecoveryKeySheetProps = {
  close?: (ctx?: string) => void;
  signup?: boolean;
};

type ActionItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void | Promise<void>;
};

function RecoveryKeySheet({ close }: RecoveryKeySheetProps) {
  const { colors } = useThemeColors();
  const [key, setKey] = useState<string | null>(null);
  const userRef = useRef<User>(undefined);
  const svgRef = useRef<{
    toDataURL: (callback: (data: string) => void) => void;
  } | null>(null);

  useEffect(() => {
    const loadRecoveryData = async () => {
      const masterKey = await db.user.getMasterKey();
      userRef.current = await db.user.getUser();
      if (masterKey?.key) {
        setKey(masterKey.key);
      }
    };

    void loadRecoveryData();
  }, []);

  const copyToClipboard = () => {
    if (!key) return;
    Clipboard.setString(key);
    ToastManager.show({
      heading: strings.recoveryKeyCopied(),
      type: "success",
      context: "local"
    });
  };

  const saveQRCODE = async () => {
    svgRef.current?.toDataURL(async (data) => {
      try {
        let fileName =
          "nn_" +
          userRef.current?.email +
          "_recovery_key_qrcode" +
          "_" +
          Date.now();
        fileName = sanitizeFilename(fileName, { replacement: "_" });
        fileName = fileName + ".png";

        const path = RNFetchBlob.fs.dirs.CacheDir + fileName;
        await RNFetchBlob.fs.writeFile(path, data, "base64");
        await CameraRoll.saveToCameraRoll(`file://` + path);
        ToastManager.show({
          heading: strings.recoveryKeyQRCodeSaved(),
          type: "success",
          context: "local"
        });
      } catch (e) {
        console.error(e);
      }
    });
  };

  const saveToTextFile = async () => {
    if (!key) return;

    try {
      let path: string;
      let fileName = `nn_${userRef.current?.email || "user"}_recovery_key`;
      fileName = sanitizeFilename(fileName, { replacement: "_" });
      fileName = `${fileName}.txt`;

      if (Platform.OS === "android") {
        const file = await ScopedStorage.createDocument(
          fileName,
          "text/plain",
          key,
          "utf8"
        );
        if (!file) return;
        path = file.uri;
      } else {
        path = await filesystem.checkAndCreateDir("/");
        await RNFetchBlob.fs.writeFile(path + fileName, key, "utf8");
        path = path + fileName;
      }

      ToastManager.show({
        heading: strings.recoveryKeyTextFileSaved(),
        type: "success",
        context: "local"
      });
      return path;
    } catch (error) {
      alert((error as Error).message);
    }
  };

  const shareFile = async () => {
    const path = await saveToTextFile();
    if (!path) return;

    try {
      useSettingStore.getState().setAppDidEnterBackgroundForAction(true);
      if (Platform.OS === "ios") {
        Share.open({
          url: path,
          failOnCancel: false
        }).catch(() => {
          /* empty */
        });
      } else {
        FileViewer.open(path, {
          showOpenWithDialog: true,
          showAppsSuggestions: true,
          //@ts-ignore
          shareFile: true
        }).catch(() => {
          /* empty */
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const closeSheet = () => {
    close?.();
    SettingsService.set({ recoveryKeySaved: true });
    clearMessage();
  };

  const actionItems: ActionItem[] = [
    {
      id: "copy-clipboard",
      icon: "recovery-key-copy",
      title: strings.copyToClipboard(),
      subtitle: "Copy the recovery key to your clipboard",
      onPress: copyToClipboard
    },
    {
      id: "save-qr",
      icon: "recovery-key-qr-code",
      title: strings.saveQRCode(),
      subtitle: "Save the QR code to your gallery",
      onPress: saveQRCODE
    },
    {
      id: "save-text",
      icon: "recovery-key-file",
      title: strings.saveAsText(),
      subtitle: "Save the recovery key to a text file",
      onPress: saveToTextFile
    },
    {
      id: "share-cloud",
      icon: "recovery-key-cloud-arrow-down",
      title: strings.shareToCloud(),
      subtitle: "Securely save the recovery key to cloud",
      onPress: shareFile
    }
  ];

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_2,
        gap: Spacing.LEVEL_2,
        maxHeight: "95%"
      }}
    >
      <ScrollView bounces={false} style={{ width: "100%" }}>
        <View style={{ gap: Spacing.LEVEL_0 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: Spacing.LEVEL_1
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.secondary.background
              }}
            >
              <AppIcon
                name="recovery-key-key"
                iconFamily="notesnook"
                size={16}
                color={colors.primary.icon}
              />
            </View>

            <View style={{ flex: 1, gap: Spacing.LEVEL_1 }}>
              <Heading
                size={AppFontSize.xl}
                style={{
                  lineHeight: AppFontSize.xl
                }}
                fontFamily="SEMI_BOLD"
              >
                {strings.saveRecoveryKey()}
              </Heading>
              <Paragraph
                size={AppFontSize.xs}
                color={colors.primary.paragraph}
                style={{
                  lineHeight: AppFontSize.xs * 1.2
                }}
              >
                {strings.saveRecoveryKeyDesc()}
              </Paragraph>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.primary.border,
              width: "100%",
              marginVertical: Spacing.LEVEL_2
            }}
          />

          <View
            style={{
              backgroundColor: colors.secondary.background,
              borderRadius: Radius.S,
              padding: Spacing.LEVEL_2,
              gap: Spacing.LEVEL_2
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: Spacing.LEVEL_1
              }}
            >
              <AppIcon
                name="recovery-key-shield-check"
                iconFamily="notesnook"
                size={16}
                color={colors.primary.accent}
              />
              <Paragraph
                size={AppFontSize.sm}
                color={colors.primary.accent}
                style={{
                  lineHeight: AppFontSize.sm
                }}
              >
                {strings.yourRecoveryKey()}
              </Paragraph>
            </View>

            <View
              style={{
                backgroundColor: colors.tertiary.background,
                borderRadius: Radius.XS,
                borderWidth: 1.3,
                borderStyle: "dashed",
                borderColor: colors.primary.accent,
                paddingHorizontal: Spacing.LEVEL_2,
                paddingVertical: Spacing.LEVEL_3,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: Spacing.LEVEL_2
              }}
            >
              <Paragraph
                size={AppFontSize.sm}
                color={colors.primary.paragraph}
                selectable
                style={{
                  lineHeight: AppFontSize.sm * 1.2,
                  flexShrink: 1
                }}
              >
                {key || ""}
              </Paragraph>

              <Button
                icon="recovery-key-copy"
                iconFamily="notesnook"
                title={strings.copy()}
                onPress={copyToClipboard}
                fontSize={AppFontSize.sm}
                style={{
                  paddingHorizontal: 0
                }}
              />
            </View>
          </View>

          <View
            style={{
              gap: Spacing.LEVEL_0
            }}
          >
            {actionItems.map((item) => (
              <Pressable
                key={item.id}
                onPress={item.onPress}
                style={{
                  width: "100%",
                  borderRadius: Radius.S,
                  paddingVertical: Spacing.LEVEL_1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: Spacing.LEVEL_1
                }}
              >
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: Radius.XS,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.secondary.background
                  }}
                >
                  <AppIcon
                    name={item.icon}
                    iconFamily="notesnook"
                    size={16}
                    color={colors.primary.icon}
                  />
                </View>

                <View style={{ flex: 1, gap: Spacing.LEVEL_0 }}>
                  <Heading size={AppFontSize.sm} fontFamily="MEDIUM">
                    {item.title}
                  </Heading>
                  <Paragraph
                    size={AppFontSize.xs}
                    color={colors.primary.paragraph}
                  >
                    {item.subtitle}
                  </Paragraph>
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <Button
        title={strings.done()}
        width="100%"
        type="accent"
        onPress={closeSheet}
        style={{
          borderRadius: Radius.S
        }}
      />

      <View
        style={{
          position: "absolute",
          left: -9999,
          top: -9999,
          opacity: 0
        }}
      >
        {key ? (
          <QRCode
            getRef={(ref) => {
              svgRef.current = ref;
            }}
            size={500}
            value={key}
            logoBorderRadius={10}
          />
        ) : null}
      </View>
    </View>
  );
}

RecoveryKeySheet.present = (signup?: boolean) => {
  presentSheet({
    disableClosing: false,
    component: (ref, close) => (
      <RecoveryKeySheet close={close} signup={signup} />
    )
  });
};

export default RecoveryKeySheet;
