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

import { hosts, Monograph, Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
//@ts-ignore
import ToggleSwitch from "toggle-switch-react-native";
import { db } from "../../../common/database";
import { requestInAppReview } from "../../../services/app-review";
import { presentSheet, ToastManager } from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useAttachmentStore } from "../../../stores/use-attachment-store";
import { openLinkInBrowser } from "../../../utils/functions";
import { AppFontSize, defaultBorderRadius } from "../../../utils/size";
import { DefaultAppStyles } from "../../../utils/styles";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import { IconButton } from "../../ui/icon-button";
import Input from "../../ui/input";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { useAsync } from "react-async-hook";
import { isFeatureAvailable, useIsFeatureAvailable } from "@notesnook/common";

async function fetchMonographData(noteId: string) {
  const monographId = db.monographs.monograph(noteId);
  const monograph = monographId
    ? await db.monographs.get(monographId)
    : undefined;
  const analyticsFeature = await isFeatureAvailable("monographAnalytics");
  const analytics =
    monographId && analyticsFeature
      ? await db.monographs.analytics(monographId)
      : undefined;
  return {
    monograph,
    monographId,
    analytics
  };
}

const PublishNoteSheet = ({
  note
}: {
  note: Note;
  close?: (ctx?: string) => void;
}) => {
  const { colors } = useThemeColors();
  const attachmentDownloads = useAttachmentStore((state) => state.downloading);
  const downloading = attachmentDownloads?.[`monograph-${note.id}`];
  const [selfDestruct, setSelfDestruct] = useState(false);
  const isFeatureAvailable = useIsFeatureAvailable("monographAnalytics");
  const [isLocked, setIsLocked] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const pwdInput = useRef<TextInput>(null);
  const passwordValue = useRef<string>(undefined);
  const monographData = useAsync(async () => {
    return fetchMonographData(note?.id);
  }, []);
  const monograph = monographData.result?.monograph;
  const publishUrl = monograph && `${hosts.MONOGRAPH_HOST}/${monograph?.id}`;
  const isPublished = db.monographs.monograph(note?.id);

  useEffect(() => {
    (async () => {
      if (monograph) {
        setSelfDestruct(!!monograph?.selfDestruct);
        if (monograph.password) {
          passwordValue.current = await db.monographs.decryptPassword(
            monograph?.password
          );
          setIsLocked(!!monograph?.password);
        }
      }
    })();
  }, [monograph]);

  const publishNote = async () => {
    if (publishing) return;
    setPublishLoading(true);

    try {
      if (note?.id) {
        if (isLocked && !passwordValue.current) return;
        await db.monographs.publish(note.id, {
          selfDestruct: selfDestruct,
          password: isLocked ? passwordValue.current : undefined
        });

        await monographData.execute();
        Navigation.queueRoutesForUpdate();
        setPublishLoading(false);
      }
      requestInAppReview();
    } catch (e) {
      ToastManager.show({
        heading: strings.failedToPublish(),
        message: (e as Error).message,
        type: "error",
        context: "local"
      });
    }

    setPublishLoading(false);
  };

  const setPublishLoading = (value: boolean) => {
    setPublishing(value);
  };

  const deletePublishedNote = async () => {
    if (publishing) return;
    setPublishLoading(true);
    try {
      if (note?.id) {
        await db.monographs.unpublish(note.id);
        monographData.execute();
        Navigation.queueRoutesForUpdate();
        setPublishLoading(false);
      }
    } catch (e) {
      ToastManager.show({
        heading: strings.failedToUnpublish(),
        message: (e as Error).message,
        type: "error",
        context: "local"
      });
    }
    setPublishLoading(false);
  };

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: DefaultAppStyles.GAP,
        gap: DefaultAppStyles.GAP_VERTICAL
      }}
    >
      {isPublished &&
      (monographData?.result?.monograph || monographData?.loading) ? null : (
        <DialogHeader
          title={strings.publishNote()}
          paragraph={strings.publishNoteDesc()}
        />
      )}

      {publishing || monographData.loading ? (
        <View
          style={{
            justifyContent: "center",
            alignContent: "center",
            height: 150,
            width: "100%"
          }}
        >
          <ActivityIndicator size={25} color={colors.primary.accent} />
          <Paragraph
            style={{
              textAlign: "center"
            }}
          >
            {strings.pleaseWait()}...
            {downloading && downloading.current && downloading.total
              ? `\n${strings.downloadingAttachments()} (${
                  downloading?.current / downloading?.total
                })`
              : ""}
          </Paragraph>
        </View>
      ) : (
        <>
          {isPublished && publishUrl ? (
            <TouchableOpacity
              onPress={async () => {
                try {
                  await openLinkInBrowser(publishUrl);
                } catch (e) {
                  console.error(e);
                }
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: DefaultAppStyles.GAP_VERTICAL,
                backgroundColor: colors.secondary.background,
                padding: DefaultAppStyles.GAP,
                borderRadius: defaultBorderRadius
              }}
            >
              <View
                style={{
                  width: "100%",
                  flexShrink: 1
                }}
              >
                <Heading size={AppFontSize.md}>
                  {strings.publishedAt()}:
                </Heading>
                <Paragraph size={AppFontSize.sm} numberOfLines={1}>
                  {publishUrl}
                </Paragraph>
              </View>

              <IconButton
                onPress={() => {
                  Clipboard.setString(publishUrl as string);
                  ToastManager.show({
                    heading: strings.monographUrlCopied(),
                    type: "success",
                    context: "local"
                  });
                }}
                color={colors.primary.accent}
                size={AppFontSize.lg}
                name="content-copy"
              />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={() => {
              if (publishing) return;
              setIsLocked(!isLocked);
            }}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.secondary.background,
              borderRadius: defaultBorderRadius,
              paddingHorizontal: DefaultAppStyles.GAP,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            <View
              style={{
                width: "100%",
                flexShrink: 1
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between"
                }}
              >
                <Paragraph size={AppFontSize.sm}>
                  {strings.monographPassHeading()}
                </Paragraph>
                <ToggleSwitch
                  isOn={isLocked}
                  onColor={colors.primary.accent}
                  offColor={colors.primary.icon}
                  size="small"
                  animationSpeed={150}
                  onToggle={() => setIsLocked(!isLocked)}
                />
              </View>

              {/* <Paragraph>{strings.monographPassDesc()}</Paragraph> */}

              {isLocked ? (
                <>
                  <Input
                    fwdRef={pwdInput}
                    onChangeText={(value) => (passwordValue.current = value)}
                    blurOnSubmit
                    secureTextEntry
                    defaultValue={passwordValue.current}
                    placeholder={strings.enterPassword()}
                    containerStyle={{
                      marginTop: DefaultAppStyles.GAP_VERTICAL
                    }}
                  />
                </>
              ) : null}
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              setSelfDestruct(!selfDestruct);
            }}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.secondary.background,
              paddingVertical: DefaultAppStyles.GAP_VERTICAL,
              borderRadius: defaultBorderRadius,
              paddingHorizontal: DefaultAppStyles.GAP
            }}
          >
            <View
              style={{
                width: "100%",
                flexShrink: 1
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between"
                }}
              >
                <Paragraph size={AppFontSize.sm}>
                  {strings.monographSelfDestructHeading()}
                </Paragraph>
                <ToggleSwitch
                  isOn={selfDestruct}
                  onColor={colors.primary.accent}
                  offColor={colors.primary.icon}
                  size="small"
                  animationSpeed={150}
                  onToggle={() => setSelfDestruct(!selfDestruct)}
                />
              </View>

              {/* <Paragraph>{strings.monographSelfDestructDesc()}</Paragraph> */}
            </View>
          </TouchableOpacity>

          {isFeatureAvailable?.isAllowed ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: colors.secondary.background,
                paddingVertical: DefaultAppStyles.GAP_VERTICAL,
                borderRadius: defaultBorderRadius,
                paddingHorizontal: DefaultAppStyles.GAP
              }}
            >
              <View
                style={{
                  width: "100%",
                  flexShrink: 1
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between"
                  }}
                >
                  <Paragraph size={AppFontSize.sm}>{strings.views()}</Paragraph>
                  <Paragraph>
                    {monographData?.result?.analytics?.totalViews || 0}
                  </Paragraph>
                </View>
              </View>
            </View>
          ) : null}

          <View
            style={{
              width: "100%",
              justifyContent: "center",
              gap: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            <Button
              onPress={publishNote}
              style={{
                width: "100%",
                borderRadius: defaultBorderRadius
              }}
              type="accent"
              title={isPublished ? strings.update() : strings.publish()}
            />

            {isPublished && (
              <>
                <Button
                  onPress={deletePublishedNote}
                  type="error"
                  title={strings.unpublish()}
                  style={{
                    width: "100%",
                    borderRadius: defaultBorderRadius
                  }}
                />
              </>
            )}
          </View>
        </>
      )}

      <Paragraph
        color={colors.secondary.paragraph}
        size={AppFontSize.xs}
        style={{
          textAlign: "center",
          marginTop: DefaultAppStyles.GAP_VERTICAL,
          textDecorationLine: "underline"
        }}
        onPress={async () => {
          try {
            await openLinkInBrowser(
              "https://help.notesnook.com/publish-notes-with-monographs"
            );
          } catch (e) {
            console.error(e);
          }
        }}
      >
        {strings.monographLearnMore()}
      </Paragraph>
    </View>
  );
};

PublishNoteSheet.present = (note: Note) => {
  presentSheet({
    component: (ref, close, update) => (
      <PublishNoteSheet close={close} note={note} />
    )
  });
};

export default PublishNoteSheet;
