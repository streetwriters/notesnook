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
import { format, LogLevel, logManager } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { LogMessage } from "@notesnook/logger";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useRef, useState } from "react";
import { FlatList, Platform, TouchableOpacity, View } from "react-native";
import RNFetchBlob from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import { Radius, Spacing } from "../../../common/design/spacing";
import filesystem from "../../../common/filesystem";
import { presentDialog } from "../../../components/dialog/functions";
import AppIcon from "../../../components/ui/AppIcon";
import { IconButton } from "../../../components/ui/icon-button";
import { Notice } from "../../../components/ui/notice";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import useTimer from "../../../hooks/use-timer";
import { ToastManager } from "../../../services/event-manager";
import { hexToRGBA } from "../../../utils/colors";

export default function DebugLogs() {
  const { colors } = useThemeColors();
  const { seconds, start } = useTimer("debug_logs_timer");
  const listRef = useRef<FlatList>(null);
  const [logs, setLogs] = useState<
    {
      key: string;
      logs: LogMessage[];
    }[]
  >([]);
  const [currentLog, setCurrentLog] = useState<{
    key: string;
    logs: LogMessage[];
  }>();

  useEffect(() => {
    (async () => {
      if (seconds === 0) {
        start(5, "debug_logs_timer");
        const logs = await logManager?.get();
        if (!logs) return;
        if (logs.length > 0 && !currentLog) {
          setCurrentLog(logs[0]);
        } else {
          setCurrentLog(logs[logs.findIndex((l) => l.key === currentLog?.key)]);
        }
        setLogs(logs);
      }
    })();
  }, [currentLog, seconds, start]);

  const currentIndex = currentLog
    ? logs.findIndex((l) => l.key === currentLog.key)
    : -1;

  const renderItem = React.useCallback(
    ({ item }: { item: LogMessage; index: number }) => {
      const isError =
        item.level === LogLevel.Error || item.level === LogLevel.Fatal;
      const isWarn = item.level === LogLevel.Warn;

      const background = "transparent";

      const color = isError
        ? colors.error.paragraph
        : isWarn
          ? colors.static.black
          : colors.primary.paragraph;

      return !item ? null : (
        <TouchableOpacity
          activeOpacity={0.6}
          onLongPress={() => {
            Clipboard.setString(format(item));
            ToastManager.show({
              heading: strings.logsCopied(),
              context: "global",
              type: "success"
            });
          }}
          style={{
            paddingVertical: Spacing.LEVEL_2,
            backgroundColor: background,
            flexShrink: 1,
            borderBottomWidth: 1,
            borderBottomColor: colors.primary.border
          }}
        >
          <Paragraph
            style={{
              flexShrink: 1,
              flexWrap: "wrap",
              fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace"
            }}
            size={12}
            color={color}
          >
            {format(item)}
          </Paragraph>
        </TouchableOpacity>
      );
    },
    [
      colors.primary.paragraph,
      colors.error.paragraph,
      colors.static.black,
      colors.primary.border
    ]
  );

  const downloadLogs = React.useCallback(async () => {
    try {
      let path = null;
      const fileName = sanitizeFilename(`notesnook_logs_${Date.now()}`);
      const data = currentLog?.logs
        .map((log) => {
          return !log ? "" : format(log);
        })
        .join("\n");
      if (!data) return;
      if (Platform.OS === "android") {
        const file = await ScopedStorage.createDocument(
          fileName + ".txt",
          "text/plain",
          data,
          "utf8"
        );
        if (!file) return;
        path = file.uri;
      } else {
        path = await filesystem.checkAndCreateDir("/");
        await RNFetchBlob.fs.writeFile(path + fileName + ".txt", data, "utf8");
        path = path + fileName;
      }

      if (path) {
        ToastManager.show({
          heading: strings.logsDownloaded(),
          context: "global",
          type: "success"
        });
      }
    } catch (e) {
      /**
      empty */
    }
  }, [currentLog?.logs]);

  const copyLogs = React.useCallback(() => {
    const data = currentLog?.logs
      .map((log) => {
        return !log ? "" : format(log);
      })
      .join("\n");
    if (!data) return;
    Clipboard.setString(data);
    ToastManager.show({
      heading: strings.logsCopied(),
      context: "global",
      type: "success"
    });
  }, [currentLog?.logs]);

  const clearLogs = React.useCallback(() => {
    if (!currentLog) return;
    presentDialog({
      title: strings.clearLogs(),
      paragraph: strings.clearLogsConfirmation(currentLog.key),
      negativeText: strings.cancel(),
      positiveText: strings.clear(),
      positivePress: async () => {
        const index = logs.findIndex((l) => (l.key = currentLog.key));
        logManager?.delete(currentLog.key);
        if (logs.length > 1) {
          if (logs.length - 1 === index) {
            setCurrentLog(logs[index - 1]);
          } else {
            setCurrentLog(logs[index + 1]);
          }
        } else {
          setCurrentLog(undefined);
        }
      }
    });
  }, [currentLog, logs]);

  return (
    <View
      style={{
        flex: 1
      }}
    >
      <View
        style={{
          paddingHorizontal: Spacing.LEVEL_3,
          paddingBottom: Spacing.LEVEL_4
        }}
      >
        <Notice text={strings.debugNotice()} type="information" />
      </View>

      {currentLog && (
        <FlatList
          ref={listRef}
          ListHeaderComponent={
            <View
              style={{
                paddingBottom: Spacing.LEVEL_2,
                gap: Spacing.LEVEL_2,
                backgroundColor: colors.primary.background,
                borderBottomWidth: 1,
                borderBottomColor: colors.primary.border
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: Spacing.LEVEL_2
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    gap: Spacing.LEVEL_2,
                    flexShrink: 1
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
                      name="file-text"
                      iconFamily="notesnook"
                      size={18}
                      color={colors.primary.icon}
                    />
                  </View>

                  <View
                    style={{
                      flexShrink: 1,
                      gap: Spacing.LEVEL_0
                    }}
                  >
                    <Heading fontSize="SM" lineHeight="100%" numberOfLines={1}>
                      {currentLog.key}
                    </Heading>
                    <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
                      {`${currentIndex + 1} / ${logs.length}`}
                    </Paragraph>
                  </View>
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: Spacing.LEVEL_0
                  }}
                >
                  <IconButton
                    onPress={() => {
                      if (currentIndex <= 0) return;
                      setCurrentLog(logs[currentIndex - 1]);
                    }}
                    disabled={currentIndex <= 0}
                    size={16}
                    name="chevron-right"
                    iconFamily="notesnook"
                    style={{
                      width: 36,
                      height: 36,
                      transform: [{ rotate: "180deg" }]
                    }}
                    color={
                      currentIndex <= 0
                        ? colors.disabled.icon
                        : colors.primary.icon
                    }
                  />
                  <IconButton
                    onPress={() => {
                      if (currentIndex === logs.length - 1) return;
                      setCurrentLog(logs[currentIndex + 1]);
                    }}
                    disabled={currentIndex === logs.length - 1}
                    size={16}
                    name="chevron-right"
                    iconFamily="notesnook"
                    style={{
                      width: 36,
                      height: 36
                    }}
                    color={
                      currentIndex === logs.length - 1
                        ? colors.disabled.icon
                        : colors.primary.icon
                    }
                  />

                  <IconButton
                    onPress={copyLogs}
                    size={16}
                    name="recovery-key-copy"
                    iconFamily="notesnook"
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: Radius.XS
                    }}
                    color={colors.primary.icon}
                  />
                  <IconButton
                    onPress={downloadLogs}
                    size={16}
                    name="download-simple"
                    iconFamily="notesnook"
                    style={{
                      width: 36,
                      height: 36
                    }}
                    color={colors.primary.icon}
                  />
                  <IconButton
                    onPress={clearLogs}
                    size={16}
                    name="trash"
                    iconFamily="notesnook"
                    style={{
                      width: 36,
                      height: 36
                    }}
                    color={colors.error.accent}
                  />
                </View>
              </View>
            </View>
          }
          style={{
            flex: 1,
            width: "100%"
          }}
          stickyHeaderIndices={[0]}
          contentContainerStyle={{
            paddingHorizontal: Spacing.LEVEL_3
          }}
          ListFooterComponent={
            <View
              style={{
                height: 200
              }}
            />
          }
          data={currentLog.logs}
          renderItem={renderItem}
        />
      )}
    </View>
  );
}
