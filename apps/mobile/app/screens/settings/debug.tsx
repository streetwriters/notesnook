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
import filesystem from "../../common/filesystem";
import { presentDialog } from "../../components/dialog/functions";
import { IconButton } from "../../components/ui/icon-button";
import { Notice } from "../../components/ui/notice";
import Paragraph from "../../components/ui/typography/paragraph";
import useTimer from "../../hooks/use-timer";
import { ToastManager } from "../../services/event-manager";
import { hexToRGBA } from "../../utils/colors";

export default function DebugLogs() {
  const { colors } = useThemeColors();
  const { seconds, start } = useTimer("debug_logs_timer");
  const listRef = useRef<FlatList>(null);
  const currentOffset = useRef(0);
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

  const renderItem = React.useCallback(
    ({ item }: { item: LogMessage; index: number }) => {
      const background =
        item.level === LogLevel.Error || item.level === LogLevel.Fatal
          ? hexToRGBA(colors.error.paragraph, 0.2)
          : item.level === LogLevel.Warn
          ? hexToRGBA(colors.static.orange, 0.2)
          : "transparent";

      const color =
        item.level === LogLevel.Error || item.level === LogLevel.Fatal
          ? colors.error.paragraph
          : item.level === LogLevel.Warn
          ? colors.static.black
          : colors.primary.paragraph;

      return !item ? null : (
        <TouchableOpacity
          activeOpacity={1}
          onLongPress={() => {
            Clipboard.setString(format(item));
            ToastManager.show({
              heading: strings.logsCopied(),
              context: "global",
              type: "success"
            });
          }}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 12,
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
      colors.secondary.background,
      colors.primary.paragraph,
      colors.error.paragraph,
      colors.static.black,
      colors.static.orange,
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
      console.log(e);
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
      positivePress: () => {
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
          padding: 12
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
                paddingHorizontal: 12,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.primary.background,
                justifyContent: "space-between"
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center"
                }}
              >
                <Paragraph>{currentLog.key}</Paragraph>

                <IconButton
                  style={{
                    width: 30,
                    height: 30,
                    marginHorizontal: 5
                  }}
                  onPress={() => {
                    const index = logs.findIndex(
                      (l) => l.key === currentLog.key
                    );
                    if (index === 0) return;
                    setCurrentLog(logs[index - 1]);
                  }}
                  size={20}
                  name="chevron-left"
                  color={colors.primary.icon}
                />

                <IconButton
                  style={{
                    width: 30,
                    height: 30
                  }}
                  onPress={() => {
                    const index = logs.findIndex(
                      (l) => l.key === currentLog.key
                    );
                    if (index === logs.length - 1) return;
                    setCurrentLog(logs[index + 1]);
                  }}
                  size={20}
                  name="chevron-right"
                  color={colors.primary.icon}
                />
              </View>

              <View
                style={{
                  flexDirection: "row"
                }}
              >
                <IconButton
                  onPress={copyLogs}
                  size={20}
                  style={{
                    width: 30,
                    height: 30,
                    marginRight: 5
                  }}
                  name="content-copy"
                  color={colors.secondary.paragraph}
                />
                <IconButton
                  onPress={downloadLogs}
                  style={{
                    width: 30,
                    height: 30,
                    marginRight: 5
                  }}
                  size={20}
                  name="download"
                  color={colors.secondary.paragraph}
                />

                <IconButton
                  onPress={clearLogs}
                  style={{
                    width: 30,
                    height: 30,
                    marginRight: 5
                  }}
                  size={20}
                  name="delete"
                  color={colors.secondary.paragraph}
                />
              </View>
            </View>
          }
          style={{
            flex: 1,
            width: "100%"
          }}
          stickyHeaderIndices={[0]}
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
