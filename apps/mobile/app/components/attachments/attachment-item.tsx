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

import { formatBytes, getFormattedDate } from "@notesnook/common";
import { Attachment, VirtualizedGrouping } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { View } from "react-native";
import { Radius, Spacing } from "../../common/design/spacing";
import { useAttachmentProgress } from "../../hooks/use-attachment-progress";
import { useDBItem } from "../../hooks/use-db-item";
import AppIcon from "../ui/AppIcon";
import { Pressable } from "../ui/pressable";
import { ProgressBarComponent } from "../ui/svg/lazy";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import Actions from "./actions";
import { IconButton } from "../ui/icon-button";

function getAttachmentIcon(attachment: Attachment) {
  const mimeType = attachment.mimeType || "";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video-camera";
  if (mimeType.startsWith("audio/")) return "music-notes";
  return "file-text";
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
        alignItems: "center",
        justifyContent: "space-between",
        gap: Spacing.LEVEL_2,
        borderWidth: 1,
        borderColor: colors.primary.border,
        borderRadius: Radius.S,
        paddingHorizontal: Spacing.LEVEL_2,
        paddingVertical: Spacing.LEVEL_3,
        marginBottom: Spacing.LEVEL_2
      }}
    >
      {!attachment ? null : (
        <>
          <View
            style={{
              flexShrink: 1,
              flexDirection: "row",
              alignItems: "center",
              gap: Spacing.LEVEL_2
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: Radius.XS,
                backgroundColor: colors.secondary.background,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <AppIcon
                name={getAttachmentIcon(attachment)}
                iconFamily="notesnook"
                size={20}
                color={colors.primary.icon}
              />
            </View>

            <View
              style={{
                flexShrink: 1,
                width: "100%",
                gap: Spacing.LEVEL_1
              }}
            >
              <Heading
                fontSize="MD"
                lineBreakMode="middle"
                color={colors.primary.heading}
              >
                book.pdf
              </Heading>

              <View
                style={{
                  flexDirection: "row",
                  gap: Spacing.LEVEL_1
                }}
              >
                {attachment.failed ? (
                  <AppIcon
                    size={13}
                    name="alert-circle-outline"
                    color={colors.error.paragraph}
                  />
                ) : null}
                {!hideWhenNotDownloading ? (
                  <Paragraph
                    fontSize="XS"
                    numberOfLines={1}
                    color={colors.secondary.paragraph}
                  >
                    {getFormattedDate(attachment.dateModified)} |{" "}
                    {formatBytes(attachment.size)}
                  </Paragraph>
                ) : null}
              </View>

              {currentProgress ? (
                <View
                  style={{
                    width: "100%",
                    gap: Spacing.LEVEL_0,
                    flexGrow: 1
                  }}
                >
                  <ProgressBarComponent
                    height={6}
                    width={null}
                    animated={true}
                    useNativeDriver
                    progress={currentProgress.value}
                    unfilledColor={colors.secondary.background}
                    color={colors.primary.accent}
                    borderWidth={0}
                  />
                  <Paragraph color={colors.secondary.paragraph} fontSize="XS">
                    {currentProgress.percent} |{" "}
                    {currentProgress.type === "upload"
                      ? strings.uploading()
                      : strings.downloading()}
                  </Paragraph>
                </View>
              ) : null}
            </View>
          </View>
        </>
      )}

      <IconButton
        color={colors.secondary.icon}
        name="dots-three"
        iconFamily="notesnook"
        size={20}
        onPress={onPress}
        style={{
          justifyContent: "center",
          height: undefined,
          width: undefined,
          borderRadius: 100,
          alignItems: "center"
        }}
      />
    </Pressable>
  );
};
