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
import { formatBytes } from "@notesnook/common";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { IconButton } from "../../components/ui/icon-button";
import { ProgressBarComponent } from "../../components/ui/svg/lazy";
import Paragraph from "../../components/ui/typography/paragraph";
import { useAttachmentProgress } from "../../hooks/use-attachment-progress";
import { useDBItem } from "../../hooks/use-db-item";
import { useAttachmentStore } from "../../stores/use-attachment-store";
import { AppFontSize } from "../../utils/size";
import { strings } from "@notesnook/intl";

export const AttachmentGroupProgress = (props: { groupId?: string }) => {
  const { colors } = useThemeColors();
  const progress = useAttachmentStore((state) =>
    !props.groupId ? undefined : state.downloading?.[props.groupId]
  );
  const [file] = useDBItem(progress?.filename, "attachment");
  const [fileProgress] = useAttachmentProgress(file, false);

  return !progress ||
    progress.canceled ||
    progress.current === progress.total ? null : (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.primary.border,
        borderRadius: 10,
        padding: 12,
        flexDirection: "row",
        gap: 10
      }}
    >
      <Icon name="download" size={AppFontSize.xxxl} />
      <View
        style={{
          gap: 5,
          flex: 1
        }}
      >
        <Paragraph>
          {progress.message || "Downloading files"} ({progress?.current}/
          {progress?.total})
        </Paragraph>

        {progress && progress.current && progress.total ? (
          <View
            style={{
              width: "100%",
              marginTop: 10
            }}
          >
            <ProgressBarComponent
              height={5}
              width={null}
              animated={true}
              useNativeDriver
              progress={progress.current / progress.total}
              unfilledColor={colors.secondary.background}
              color={colors.primary.accent}
              borderWidth={0}
            />
          </View>
        ) : null}

        <Paragraph
          style={{
            fontSize: 10,
            color: colors.secondary.paragraph
          }}
          numberOfLines={1}
        >
          {strings.downloading()} {file?.filename}{" "}
          {formatBytes(file?.size || 0)}{" "}
          {fileProgress?.percent ? `(${fileProgress.percent})` : ""}
        </Paragraph>
        <Paragraph size={10} color={colors.secondary.paragraph}>
          {strings.group()}: {props.groupId}
        </Paragraph>
      </View>
      {props.groupId === "offline-mode" ? null : (
        <IconButton
          name="close"
          onPress={() => {
            if (props.groupId) {
              useAttachmentStore.getState().setDownloading({
                groupId: props.groupId,
                canceled: true,
                current: 0,
                total: 0,
                message: undefined
              });
              setTimeout(() => {
                if (props.groupId) {
                  db.fs().cancel(props.groupId);
                }
              });
            }
          }}
        />
      )}
    </View>
  );
};
