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

import { format, logManager } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Platform, View } from "react-native";
import FileViewer from "react-native-file-viewer";
import ReactNativeBlobUtil from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import Share from "react-native-share";
import { zip } from "react-native-zip-archive";
import filesystem from "../../../common/filesystem";
import { cacheDir, copyFileAsync } from "../../../common/filesystem/utils";
import { Radius, Spacing } from "../../../common/design/spacing";
import { presentSheet } from "../../../services/event-manager";
import { useSettingStore } from "../../../stores/use-setting-store";
import { useUserStore } from "../../../stores/use-user-store";
import { sleep } from "../../../utils/time";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { DatabaseLogger } from "../../../common/database";

type DownloadLogsProps = {
  close?: (ctx?: string) => void;
};

type DownloadResult = {
  /** Local zip file path used for sharing/opening the archive. */
  localPath: string;
  /** Directory the archive was saved into (for "open location"). */
  directory: string;
};

type Status = "loading" | "success" | "error";

const IconTile = ({
  name,
  color,
  backgroundColor
}: {
  name: string;
  color: string;
  backgroundColor: string;
}) => (
  <View
    style={{
      width: 40,
      height: 40,
      borderRadius: Radius.XS,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor
    }}
  >
    <AppIcon name={name} iconFamily="notesnook" size={16} color={color} />
  </View>
);

async function downloadLogs(
  onStep: (message: string, progress: number) => void
): Promise<DownloadResult> {
  onStep(strings.preparingLogsChooseLocation(), 0.1);

  let directory =
    Platform.OS === "ios"
      ? await filesystem.checkAndCreateDir(`/debug-logs/`)
      : undefined;

  if (Platform.OS === "android") {
    useUserStore.setState({ disableAppLockRequests: true });
    const file = await ScopedStorage.openDocumentTree(true);
    setTimeout(() => {
      useUserStore.setState({ disableAppLockRequests: false });
    }, 1000);
    if (!file) throw new Error("no-directory");
    directory = file.uri;
  }

  if (!directory) throw new Error("no-directory");

  onStep(strings.preparingLogsCollect(), 0.35);
  const logs = await logManager?.get();
  if (!logs) throw new Error("no-logs");

  const logsDir = cacheDir + `/notesnook-debug-logs`;
  if (await ReactNativeBlobUtil.fs.exists(logsDir)) {
    await ReactNativeBlobUtil.fs.unlink(logsDir);
  }

  await ReactNativeBlobUtil.fs.mkdir(logsDir);

  for (const logGroup of logs) {
    let logString = ``;
    for (const log of logGroup.logs) {
      logString += `\n${format(log)}`;
    }
    await ReactNativeBlobUtil.fs.createFile(
      `${logsDir}/${logGroup.key}.txt`,
      logString,
      "utf8"
    );
  }

  onStep(strings.preparingLogsCompress(), 0.7);
  const fileName = `notesnook-debug-logs-${Date.now()}.zip`;
  const outputPath = await zip(
    logsDir,
    Platform.OS === "android" ? logsDir + ".zip" : `${directory}/${fileName}`
  );

  onStep(strings.preparingLogsSave(), 0.9);
  if (Platform.OS === "android") {
    const file = await ScopedStorage.createFile(
      directory,
      fileName,
      "application/zip"
    );
    await copyFileAsync("file://" + outputPath, file.uri);
    // keep `outputPath` (the cache copy) around so it can be shared/opened.
    return { localPath: outputPath, directory };
  }

  await ReactNativeBlobUtil.fs.unlink(logsDir);

  await sleep(1000);

  return { localPath: outputPath, directory };
}

function DownloadLogs({ close }: DownloadLogsProps) {
  const { colors } = useThemeColors();
  const [status, setStatus] = useState<Status>("loading");
  const [step, setStep] = useState({
    message: strings.preparingLogsChooseLocation(),
    progress: 0.1
  });
  const result = useRef<DownloadResult | undefined>(undefined);
  const started = useRef(false);

  const start = useCallback(async () => {
    setStatus("loading");
    setStep({
      message: strings.preparingLogsChooseLocation(),
      progress: 0.1
    });
    try {
      result.current = await downloadLogs((message, progress) =>
        setStep({ message, progress })
      );
      setStatus("success");
    } catch (e) {
      DatabaseLogger.error(e as Error);
      result.current = undefined;
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    start();
  }, [start]);

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_2,
        paddingBottom: Spacing.LEVEL_4,
        gap: Spacing.LEVEL_3
      }}
    >
      {status === "loading" ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: Spacing.LEVEL_2,
            width: "100%"
          }}
        >
          <IconTile
            name="clock"
            color={colors.primary.icon}
            backgroundColor={colors.secondary.background}
          />
          <Heading fontSize="XL" lineHeight="100%">
            {strings.preparingLogs()}
          </Heading>
          <Paragraph
            fontSize="SM"
            color={colors.secondary.paragraph}
            style={{ textAlign: "center" }}
          >
            {step.message}
          </Paragraph>
          <View
            style={{
              width: "100%",
              height: 8,
              borderRadius: Radius.XXL,
              backgroundColor: colors.secondary.background,
              overflow: "hidden"
            }}
          >
            <View
              style={{
                width: `${Math.round(step.progress * 100)}%`,
                height: 8,
                borderRadius: Radius.XXL,
                backgroundColor: colors.primary.accent
              }}
            />
          </View>
        </View>
      ) : status === "error" ? (
        <View style={{ width: "100%", gap: Spacing.LEVEL_3 }}>
          <View style={{ alignItems: "center", gap: Spacing.LEVEL_2 }}>
            <IconTile
              name="warning"
              color={colors.error.accent}
              backgroundColor={colors.error.background}
            />
            <View style={{ gap: Spacing.LEVEL_1, width: "100%" }}>
              <Heading
                fontSize="XL"
                lineHeight="120%"
                style={{ textAlign: "center" }}
              >
                {strings.downloadLogsFailed()}
              </Heading>
              <Paragraph
                fontSize="SM"
                color={colors.secondary.paragraph}
                style={{ textAlign: "center" }}
              >
                {strings.downloadLogsFailedDesc()}
              </Paragraph>
            </View>
          </View>
          <Button
            title={strings.tryDownloadLogsAgain()}
            type="accent"
            width="100%"
            style={{ borderRadius: Radius.S }}
            onPress={start}
          />
        </View>
      ) : (
        <View style={{ width: "100%", gap: Spacing.LEVEL_3 }}>
          <View style={{ alignItems: "center", gap: Spacing.LEVEL_2 }}>
            <IconTile
              name="checks"
              color={colors.primary.accent}
              backgroundColor={colors.secondary.background}
            />
            <View style={{ gap: Spacing.LEVEL_1, width: "100%" }}>
              <Heading
                fontSize="XL"
                lineHeight="120%"
                style={{ textAlign: "center" }}
              >
                {strings.debugLogsDownloaded()}
              </Heading>
              <Paragraph
                fontSize="SM"
                color={colors.secondary.paragraph}
                style={{ textAlign: "center" }}
              >
                {strings.debugLogsDownloadedDesc()}
              </Paragraph>
            </View>
          </View>

          <View style={{ width: "100%", gap: Spacing.LEVEL_2 }}>
            <View style={{ flexDirection: "row", gap: Spacing.LEVEL_2 }}>
              <Button
                title={strings.shareZip()}
                type="plain-outline"
                style={{ flex: 1, borderRadius: Radius.S }}
                onPress={async () => {
                  const path = result.current?.localPath;
                  if (!path) return;
                  close?.();
                  useSettingStore
                    .getState()
                    .setAppDidEnterBackgroundForAction(true);
                  if (Platform.OS === "ios") {
                    await sleep(500);
                    Share.open({ url: path }).catch(() => {
                      /* empty */
                    });
                  } else {
                    FileViewer.open(path, {
                      showOpenWithDialog: true,
                      showAppsSuggestions: true,
                      shareFile: true
                    } as any).catch(() => {
                      /* empty */
                    });
                  }
                }}
              />
              <Button
                title={strings.openFileLocation()}
                type="plain-outline"
                style={{ flex: 1, borderRadius: Radius.S }}
                onPress={async () => {
                  const path = result.current?.localPath;
                  const directory = result.current?.directory;
                  if (!path) return;
                  close?.();
                  useSettingStore
                    .getState()
                    .setAppDidEnterBackgroundForAction(true);
                  if (Platform.OS === "android") {
                    if (directory) {
                      Linking.openURL(directory).catch(() => {
                        /* empty */
                      });
                    }
                  } else {
                    await sleep(500);
                    FileViewer.open(path, {
                      showOpenWithDialog: true,
                      showAppsSuggestions: true
                    }).catch(() => {
                      /* empty */
                    });
                  }
                }}
              />
            </View>
            <Button
              title={strings.goBack()}
              type="accent"
              width="100%"
              style={{ borderRadius: Radius.S }}
              onPress={() => close?.()}
            />
          </View>
        </View>
      )}
    </View>
  );
}

DownloadLogs.present = () => {
  presentSheet({
    component: (_ref, close) => <DownloadLogs close={close} />
  });
};

export default DownloadLogs;
