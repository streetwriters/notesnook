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
import { Attachment, VirtualizedGrouping } from "@notesnook/core";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { db } from "../../common/database";
import { useAttachmentProgress } from "../../hooks/use-attachment-progress";
import { useDBItem } from "../../hooks/use-db-item";
import { defaultBorderRadius, AppFontSize } from "../../utils/size";
import { IconButton } from "../ui/icon-button";
import { ProgressCircleComponent } from "../ui/svg/lazy";
import Paragraph from "../ui/typography/paragraph";
import Actions from "./actions";
import { strings } from "@notesnook/intl";
import { Pressable } from "../ui/pressable";

function getFileExtension(filename: string) {
  const ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? "" : ext[1];
}

export const AttachmentItem = ({
  id,
  attachments,
  encryption,
  setAttachments,
  pressable = true,
  hideWhenNotDownloading,
  context,
  errorOnly
}: {
  id: string | number;
  attachments?: VirtualizedGrouping<Attachment>;
  encryption?: boolean;
  setAttachments: (attachments: any) => void;
  pressable?: boolean;
  hideWhenNotDownloading?: boolean;
  context?: string;
  errorOnly?: boolean;
}) => {
  const [attachment] = useDBItem(id, "attachment", attachments);
  const { colors } = useThemeColors();
  const [currentProgress, setCurrentProgress] = useAttachmentProgress(
    attachment,
    encryption
  );

  const onPress = () => {
    if (!pressable || !attachment) return;
    Actions.present(attachment, setAttachments, context);
  };

  return errorOnly && attachment && !attachment?.failed ? null : (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        marginVertical: 5,
        justifyContent: "space-between",
        padding: 12,
        paddingVertical: 6,
        minHeight: 45
      }}
    >
      {!attachment ? null : (
        <>
          <View
            style={{
              flexShrink: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: 10
            }}
          >
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                marginLeft: -5,
                borderWidth: 1,
                borderColor: colors.secondary.border,
                paddingHorizontal: 2,
                width: 30,
                height: 30,
                borderRadius: defaultBorderRadius
              }}
            >
              <Paragraph
                adjustsFontSizeToFit
                size={8}
                color={colors.secondary.paragraph}
                style={{
                  maxWidth: 30
                }}
                numberOfLines={1}
              >
                {getFileExtension(attachment.filename).toUpperCase() ||
                  attachment.mimeType.split("/")?.[1]?.toUpperCase()}
              </Paragraph>
            </View>

            <View
              style={{
                flexShrink: 1
              }}
            >
              <Paragraph
                size={AppFontSize.sm}
                style={{
                  flexWrap: "wrap"
                }}
                numberOfLines={1}
                lineBreakMode="middle"
                color={colors.primary.paragraph}
              >
                {attachment.filename}
              </Paragraph>

              {!hideWhenNotDownloading ? (
                <Paragraph
                  color={colors.secondary.paragraph}
                  size={AppFontSize.xxs}
                >
                  {strings.fileSize()}: {formatBytes(attachment.size)}
                </Paragraph>
              ) : null}
            </View>
          </View>

          {currentProgress ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                if (encryption || !pressable) return;
                db.fs().cancel(attachment.hash);
                setCurrentProgress(undefined);
              }}
              style={{
                justifyContent: "center",
                marginLeft: 5,
                marginTop: 5,
                marginRight: -5
              }}
            >
              <ProgressCircleComponent
                size={AppFontSize.xxl}
                progress={
                  currentProgress?.value ? currentProgress?.value / 100 : 0
                }
                showsText
                textStyle={{
                  fontSize: 10
                }}
                color={colors.primary.accent}
                formatText={(progress) => (progress * 100).toFixed(0)}
                borderWidth={0}
                thickness={2}
              />
            </TouchableOpacity>
          ) : (
            <>
              {attachment.failed ? (
                <IconButton
                  onPress={onPress}
                  name="alert-circle-outline"
                  color={colors.error.paragraph}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </Pressable>
  );
};
