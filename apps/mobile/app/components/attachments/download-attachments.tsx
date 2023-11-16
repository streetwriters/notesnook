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

import React, { useRef, useState } from "react";
import { Platform, View } from "react-native";
import { db } from "../../common/database";
import { downloadAttachments } from "../../common/filesystem/download-attachment";
import {
  PresentSheetOptions,
  presentSheet
} from "../../services/event-manager";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { ProgressBarComponent } from "../ui/svg/lazy";
import { useThemeColors } from "@notesnook/theme";
import { FlatList } from "react-native-actions-sheet";
import { AttachmentItem } from "./attachment-item";
import { Attachment, VirtualizedGrouping } from "@notesnook/core";

const DownloadAttachments = ({
  close,
  attachments,
  isNote,
  update
}: {
  attachments: VirtualizedGrouping<Attachment>;
  close?: ((ctx?: string | undefined) => void) | undefined;
  isNote?: boolean;
  update?: (props: PresentSheetOptions) => void;
}) => {
  const { colors } = useThemeColors();
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({
    value: 0,
    statusText: "Download started... Please wait"
  });
  const [result, setResult] = useState(new Map());
  const canceled = useRef(false);
  const groupId = useRef<string>();

  const onDownload = async () => {
    update?.({
      disableClosing: true
    } as PresentSheetOptions);
    setDownloading(true);
    canceled.current = false;
    groupId.current = Date.now().toString();
    const result = await downloadAttachments(
      attachments,
      (progress: number, statusText: string) =>
        setProgress({ value: progress, statusText }),
      canceled,
      groupId.current
    );
    if (canceled.current) return;
    setResult(result || new Map());
    setDownloading(false);
    update?.({
      disableClosing: false
    } as PresentSheetOptions);
  };

  const cancel = async () => {
    update?.({
      disableClosing: false
    } as PresentSheetOptions);
    canceled.current = true;
    if (!groupId.current) return;
    console.log(groupId.current, "canceling groupId downloads");
    await db.fs().cancel(groupId.current, "download");
    setDownloading(false);
    groupId.current = undefined;
  };

  const successResults = () => {
    const results = [];
    for (let [key, value] of result.entries()) {
      if (value.status === 1) results.push(db.attachments.attachment(key));
    }
    return results;
  };

  const failedResults = () => {
    const results = [];
    for (let [key, value] of result.entries()) {
      if (value.status === 0) results.push(db.attachments.attachment(key));
    }
    return results;
  };

  function getResultText() {
    const downloadedAttachmentsCount =
      attachments?.ids?.length - failedResults().length;
    if (downloadedAttachmentsCount === 0)
      return "Failed to download all attachments";
    return `Successfully downloaded ${downloadedAttachmentsCount}/${
      attachments?.ids.length
    } attachments as a zip file at ${
      Platform.OS === "android" ? "the selected folder" : "Notesnook/downloads"
    }`;
  }

  return (
    <View
      style={{
        alignItems: "center",
        width: "100%",
        paddingVertical: 12,
        paddingHorizontal: 12
      }}
    >
      <Heading>
        {downloading
          ? "Downloading attachments"
          : result?.size
          ? "Downloaded attachments"
          : "Download attachments"}
      </Heading>

      {downloading ? (
        <Paragraph
          style={{
            textAlign: "center"
          }}
        >
          {progress.statusText}
        </Paragraph>
      ) : result?.size ? (
        <Paragraph
          style={{
            textAlign: "center"
          }}
        >
          {getResultText()}
        </Paragraph>
      ) : (
        <Paragraph
          style={{
            textAlign: "center"
          }}
        >
          Are you sure you want to download all attachments
          {isNote ? " of this note?" : "?"}
        </Paragraph>
      )}

      {downloading ? (
        <View
          style={{
            width: 200,
            marginTop: 10
          }}
        >
          <ProgressBarComponent
            height={5}
            width={null}
            animated={true}
            useNativeDriver
            progress={
              progress.value ? progress.value / attachments.ids?.length : 0
            }
            unfilledColor={colors.secondary.background}
            color={colors.primary.accent}
            borderWidth={0}
          />
        </View>
      ) : null}

      <FlatList
        style={{
          maxHeight: 300,
          width: "100%",
          minHeight: 60,
          backgroundColor: colors.secondary.background,
          borderRadius: 5,
          marginVertical: 12
        }}
        data={downloading ? attachments.ids : undefined}
        ListEmptyComponent={
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              height: 60
            }}
          >
            <Paragraph color={colors.secondary.paragraph}>
              No downloads in progress.
            </Paragraph>
          </View>
        }
        keyExtractor={(item) => item as string}
        renderItem={({ item }) => {
          return (
            <AttachmentItem
              id={item as string}
              setAttachments={() => {}}
              pressable={false}
              hideWhenNotDownloading={true}
              attachments={attachments}
            />
          );
        }}
      />

      {result?.size ? (
        <Button
          style={{
            width: 250,
            borderRadius: 100,
            marginTop: 20
          }}
          onPress={() => {
            close?.();
          }}
          type="accent"
          title="Done"
        />
      ) : !downloading ? (
        <View
          style={{
            flexDirection: "row",
            width: "100%",
            marginTop: 20
          }}
        >
          <Button
            style={{
              flex: 1,
              borderRadius: 100,
              marginRight: 5
            }}
            onPress={() => {
              close?.();
            }}
            type="grayBg"
            title="No"
          />
          <Button
            style={{
              flex: 1,
              borderRadius: 100,
              marginLeft: 5
            }}
            onPress={onDownload}
            type="accent"
            title="Yes"
          />
        </View>
      ) : (
        <Button
          style={{
            width: 250,
            borderRadius: 100,
            marginTop: 20
          }}
          onPress={cancel}
          type="error"
          title="Cancel"
        />
      )}
    </View>
  );
};

DownloadAttachments.present = (
  context: string,
  attachments: VirtualizedGrouping<Attachment>,
  isNote?: boolean
) => {
  presentSheet({
    context: context,
    component: (ref, close, update) => (
      <DownloadAttachments
        close={close}
        attachments={attachments}
        isNote={isNote}
        update={update}
      />
    )
  });
};

export default DownloadAttachments;
