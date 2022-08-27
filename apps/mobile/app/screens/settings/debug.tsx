import Clipboard from "@react-native-clipboard/clipboard";
import {
  format,
  LogLevel,
  logManager
} from "@streetwriters/notesnook-core/logger";
import { useEffect, useState } from "react";
import { FlatList, Platform, TouchableOpacity, View } from "react-native";
import * as ScopedStorage from "react-native-scoped-storage";
import RNFetchBlob from "rn-fetch-blob";
import { presentDialog } from "../../components/dialog/functions";
import { IconButton } from "../../components/ui/icon-button";
import { Notice } from "../../components/ui/notice";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastEvent } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { hexToRGBA } from "../../utils/color-scheme/utils";
import Storage from "../../common/database/storage";
import useTimer from "../../hooks/use-timer";
import { sanitizeFilename } from "../../utils/sanitizer";
import { LogMessage } from "@streetwriters/logger";

// function getLevelString(level: number) {
//   switch (level) {
//     case LogLevel.Debug:
//       return 'DEBUG';
//     case LogLevel.Info:
//       return 'INFO';
//     case LogLevel.Log:
//       return 'LOG';
//     case LogLevel.Error:
//       return 'ERROR';
//     case LogLevel.Warn:
//       return 'WARN';
//     case LogLevel.Fatal:
//       return 'FATAL';
//   }
// }

export default function DebugLogs() {
  const colors = useThemeStore((state) => state.colors);
  const { seconds, start } = useTimer("debug_logs_timer");
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
  }, [seconds]);

  const renderItem = ({ item }: { item: LogMessage; index: number }) => {
    const background =
      item.level === LogLevel.Error || item.level === LogLevel.Fatal
        ? hexToRGBA(colors.red, 0.2)
        : item.level === LogLevel.Warn
        ? hexToRGBA(colors.orange, 0.2)
        : "transparent";

    const color =
      item.level === LogLevel.Error || item.level === LogLevel.Fatal
        ? colors.red
        : item.level === LogLevel.Warn
        ? colors.orange
        : colors.pri;

    return !item ? null : (
      <TouchableOpacity
        activeOpacity={1}
        onLongPress={() => {
          Clipboard.setString(format(item));
          ToastEvent.show({
            heading: "Debug log copied!",
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
          borderBottomColor: colors.nav
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
  };

  const downloadLogs = async () => {
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
        path = await Storage.checkAndCreateDir("/");
        await RNFetchBlob.fs.writeFile(path + fileName + ".txt", data, "utf8");
        path = path + fileName;
      }

      if (path) {
        ToastEvent.show({
          heading: "Debug logs downloaded",
          context: "global",
          type: "success"
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const copyLogs = () => {
    const data = currentLog?.logs
      .map((log) => {
        return !log ? "" : format(log);
      })
      .join("\n");
    if (!data) return;
    Clipboard.setString(data);
    ToastEvent.show({
      heading: "Debug log copied!",
      context: "global",
      type: "success"
    });
  };

  const clearLogs = () => {
    if (!currentLog) return;
    presentDialog({
      title: "Clear logs",
      paragraph: `Are you sure you want to delete all logs from ${currentLog.key}?`,
      negativeText: "Cancel",
      positiveText: "Clear",
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
  };

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
        <Notice
          text="All logs are local only and are not sent to any server. You can share the logs from here with us if you face an issue to help us find the root cause."
          type="information"
        />
      </View>

      {currentLog && (
        <FlatList
          ListHeaderComponent={
            <View
              style={{
                paddingHorizontal: 12,
                marginBottom: 10,
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.bg,
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
                  customStyle={{
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
                  color={colors.icon}
                />

                <IconButton
                  customStyle={{
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
                  color={colors.icon}
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
                  customStyle={{
                    width: 30,
                    height: 30,
                    marginRight: 5
                  }}
                  name="content-copy"
                  color={colors.gray}
                />
                <IconButton
                  onPress={downloadLogs}
                  customStyle={{
                    width: 30,
                    height: 30,
                    marginRight: 5
                  }}
                  size={20}
                  name="download"
                  color={colors.gray}
                />

                <IconButton
                  onPress={clearLogs}
                  customStyle={{
                    width: 30,
                    height: 30,
                    marginRight: 5
                  }}
                  size={20}
                  name="delete"
                  color={colors.gray}
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
