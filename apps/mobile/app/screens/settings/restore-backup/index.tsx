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

import { LegendList } from "@legendapp/list";
import { formatBytes, getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import RNFetchBlob, { ReactNativeBlobUtilStat } from "react-native-blob-util";
import * as ScopedStorage from "react-native-scoped-storage";
import { Spacing } from "../../../common/design/spacing";
import filesystem from "../../../common/filesystem";
import { Button } from "../../../components/ui/button";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { useSettingStore } from "../../../stores/use-setting-store";
import { AppFontSize } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import { restoreBackup } from "./restore-progress";

// The restore flow (progress, password, confirmation, error handling) lives in
// ./restore-progress alongside the dialog that drives it. Re-exported here so
// existing importers of "../restore-backup" keep working.
export { restoreBackup } from "./restore-progress";

const BACKUP_FILES_CACHE: (ReactNativeBlobUtilStat | ScopedStorage.FileType)[] =
  [];

export const RestoreBackup = () => {
  const { colors } = useThemeColors();
  const [files, setFiles] =
    useState<(ReactNativeBlobUtilStat | ScopedStorage.FileType)[]>(
      BACKUP_FILES_CACHE
    );
  const [loading, setLoading] = useState(true);
  const backupDirectoryAndroid = useSettingStore(
    (state) => state.settings.backupDirectoryAndroid
  );

  useEffect(() => {
    setTimeout(() => {
      checkBackups();
    }, 1000);
  }, []);

  const checkBackups = async () => {
    try {
      let files: (ReactNativeBlobUtilStat | ScopedStorage.FileType)[] = [];
      if (Platform.OS === "android") {
        if (backupDirectoryAndroid) {
          files = await ScopedStorage.listFiles(backupDirectoryAndroid.uri);
        } else {
          setLoading(false);
          return;
        }
      } else {
        const path = await filesystem.checkAndCreateDir("/backups/");
        files = await RNFetchBlob.fs.lstat(path);
      }
      files = files
        .filter((file) => {
          const name =
            Platform.OS === "android"
              ? (file as ScopedStorage.FileType).name
              : (file as ReactNativeBlobUtilStat).filename;
          return name.endsWith(".nnbackup") || name.endsWith(".nnbackupz");
        })
        .sort(function (a, b) {
          const timeA = a.lastModified;
          const timeB = b.lastModified;
          return timeB - timeA;
        });

      setFiles(files);
      setLoading(false);
      BACKUP_FILES_CACHE.splice(0, BACKUP_FILES_CACHE.length, ...files);
      setLoading(false);
    } catch (e) {
      e;
    } finally {
      setLoading(false);
    }
  };

  const renderItem = React.useCallback(
    ({
      item,
      index
    }: {
      item: ReactNativeBlobUtilStat | ScopedStorage.FileType;
      index: number;
    }) => <BackupItem item={item} index={index} />,
    []
  );

  return (
    <>
      <LegendList
        ListHeaderComponent={
          <Heading
            style={{
              marginBottom: Spacing.LEVEL_2
            }}
            color={colors.primary.accent}
            size={AppFontSize.sm}
            fontFamily="MEDIUM"
          >
            {strings.recentBackups()}
          </Heading>
        }
        ListEmptyComponent={
          loading ? (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                height: 300,
                paddingHorizontal: 50
              }}
            >
              <ActivityIndicator
                color={colors.primary.accent}
                size={AppFontSize.lg}
              />
            </View>
          ) : (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                gap: 12,
                height: 300,
                paddingHorizontal: 50
              }}
            >
              <Paragraph
                style={{
                  textAlign: "center"
                }}
                color={colors.secondary.paragraph}
              >
                {strings.noBackupsFound()}.
              </Paragraph>
            </View>
          )
        }
        keyExtractor={(item) =>
          (item as ScopedStorage.FileType).name ||
          (item as ReactNativeBlobUtilStat).filename
        }
        ListFooterComponent={
          <View
            style={{
              height: 200
            }}
          />
        }
        style={{
          width: "100%"
        }}
        data={files}
        renderItem={renderItem}
      />
    </>
  );
};

const BackupItem = ({
  item,
  index
}: {
  item: ReactNativeBlobUtilStat | ScopedStorage.FileType;
  index: number;
}) => {
  const { colors } = useThemeColors();
  const itemName = (
    (item as ReactNativeBlobUtilStat).filename ||
    (item as ScopedStorage.FileType).name
  )
    .replace(".nnbackupz", "")
    .replace(".nnbackup", "");

  return (
    <View
      style={{
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        borderRadius: 0,
        flexDirection: "row",
        gap: DefaultAppStyles.GAP_SMALL,
        paddingVertical: Spacing.LEVEL_2,
        borderBottomWidth: 1,
        borderBottomColor: colors.primary.separator
      }}
    >
      <View
        style={{
          flexShrink: 1,
          gap: Spacing.LEVEL_1
        }}
      >
        <Heading size={AppFontSize.md}>{itemName}</Heading>

        <Paragraph
          size={AppFontSize.xs}
          color={colors.secondary.paragraph}
          style={{ width: "100%", maxWidth: "100%" }}
        >
          Created: {getFormattedDate(item?.lastModified, "date-time")}
          {" • "}
          {formatBytes((item as ReactNativeBlobUtilStat).size)}
        </Paragraph>
      </View>
      <Button
        title="Restore"
        type="plain-outline"
        style={{
          paddingHorizontal: Spacing.LEVEL_2,
          paddingVertical: Spacing.LEVEL_1
        }}
        onPress={() => {
          restoreBackup({
            confirm: true,
            name: itemName,
            uri:
              Platform.OS === "android"
                ? (item as ScopedStorage.FileType).uri
                : (item as ReactNativeBlobUtilStat).path
          });
        }}
      />
    </View>
  );
};
