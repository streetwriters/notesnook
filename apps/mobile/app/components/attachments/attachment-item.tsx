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
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../common/database";
import { useAttachmentProgress } from "../../hooks/use-attachment-progress";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import { IconButton } from "../ui/icon-button";
import { ProgressCircleComponent } from "../ui/svg/lazy";
import Paragraph from "../ui/typography/paragraph";
import Actions from "./actions";
import { Attachment, VirtualizedGrouping } from "@notesnook/core";
import { useDBItem } from "../../hooks/use-db-item";

function getFileExtension(filename: string) {
  var ext = /^.+\.([^.]+)$/.exec(filename);
  return ext == null ? "" : ext[1];
}

export const AttachmentItem = ({
  id,
  attachments,
  encryption,
  setAttachments,
  pressable = true,
  hideWhenNotDownloading,
  context
}: {
  id: string;
  attachments?: VirtualizedGrouping<Attachment>;
  encryption?: boolean;
  setAttachments: (attachments: any) => void;
  pressable?: boolean;
  hideWhenNotDownloading?: boolean;
  context?: string;
}) => {
  const [attachment] = useDBItem(id, "attachment", attachments?.item);

  const { colors } = useThemeColors();
  const [currentProgress, setCurrentProgress] = useAttachmentProgress(
    attachment,
    encryption
  );

  const onPress = () => {
    if (!pressable || !attachment) return;
    Actions.present(attachment, setAttachments, context);
  };

  return (hideWhenNotDownloading &&
    (!currentProgress || !(currentProgress as any).value)) ||
    !attachment ? null : (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={{
        flexDirection: "row",
        marginVertical: 5,
        justifyContent: "space-between",
        padding: 12,
        paddingVertical: 6,
        borderRadius: 5,
        backgroundColor: colors.secondary.background
      }}
    >
      <View
        style={{
          flexShrink: 1,
          flexDirection: "row",
          alignItems: "center"
        }}
      >
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            marginLeft: -5
          }}
        >
          <Icon name="file" size={SIZE.xxxl} color={colors.primary.icon} />

          <Paragraph
            adjustsFontSizeToFit
            size={6}
            color={colors.static.white}
            style={{
              position: "absolute"
            }}
          >
            {getFileExtension(attachment.filename).toUpperCase()}
          </Paragraph>
        </View>

        <View
          style={{
            flexShrink: 1,
            marginLeft: 10
          }}
        >
          <Paragraph
            size={SIZE.sm - 1}
            style={{
              flexWrap: "wrap",
              marginBottom: 2.5
            }}
            numberOfLines={1}
            lineBreakMode="middle"
            color={colors.primary.paragraph}
          >
            {attachment.filename}
          </Paragraph>

          {!hideWhenNotDownloading ? (
            <Paragraph color={colors.secondary.paragraph} size={SIZE.xs}>
              {formatBytes(attachment.size)}{" "}
              {(currentProgress as any)?.type
                ? "(" + (currentProgress as any).type + "ing - tap to cancel)"
                : ""}
            </Paragraph>
          ) : null}
        </View>
      </View>

      {currentProgress ? (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (encryption || !pressable) return;
            db.fs().cancel(attachment.metadata.hash);
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
            size={SIZE.xxl}
            progress={currentProgress?.value ? currentProgress?.value / 100 : 0}
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
    </TouchableOpacity>
  );
};
