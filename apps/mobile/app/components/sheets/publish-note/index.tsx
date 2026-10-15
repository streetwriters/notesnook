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

import { Note } from "@notesnook/core";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import Clipboard from "@react-native-clipboard/clipboard";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, TextInput, View } from "react-native";
import { Radius, Spacing } from "../../../common/design/spacing";
import { db } from "../../../common/database";
import { requestInAppReview } from "../../../services/app-review";
import {
  eSendEvent,
  presentSheet,
  ToastManager
} from "../../../services/event-manager";
import Navigation from "../../../services/navigation";
import { useAttachmentStore } from "../../../stores/use-attachment-store";
import { openLinkInBrowser } from "../../../utils/functions";
import DialogHeader from "../../dialog/dialog-header";
import { presentDialog } from "../../dialog/functions";
import AppIcon, { IconProps } from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import { Pressable } from "../../ui/pressable";
import Paragraph from "../../ui/typography/paragraph";
import { useAsync } from "react-async-hook";
import { eMenuItemUpdate } from "../../../utils/events";
import { useIsFeatureAvailable } from "@notesnook/common";
import FormInput, {
  createFormRef,
  validators
} from "../../ui/input/form-input";
import { useAppState } from "../../../../app/hooks/use-app-state";
import Heading from "../../ui/typography/heading";
import { FontSizes } from "../../../common/design/font";
import { Dialog } from "../../dialog";
import LineSeparator from "../../ui/seperator/line-separator";

const OptionRow = ({
  icon,
  iconFamily = "notesnook",
  title,
  description,
  right,
  onPress,
  disabled
}: {
  icon: string;
  iconFamily?: IconProps["iconFamily"];
  title: string;
  description: string;
  right: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}) => {
  const { colors } = useThemeColors();
  return (
    <Pressable
      type="transparent"
      disabled={disabled || !onPress}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.LEVEL_2,
        width: "100%"
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: Radius.XS,
          backgroundColor: colors.secondary.background,
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <AppIcon
          name={icon}
          iconFamily={iconFamily}
          size={16}
          color={colors.primary.icon}
        />
      </View>
      <View style={{ flex: 1, gap: Spacing.LEVEL_0 }}>
        <Paragraph fontFamily="MEDIUM" fontSize="SM">
          {title}
        </Paragraph>
        <Paragraph fontSize="XS" color={colors.secondary.paragraph}>
          {description}
        </Paragraph>
      </View>
      {right}
    </Pressable>
  );
};

async function fetchMonographData(noteId: string) {
  const monographId = db.monographs.monograph(noteId);
  const monograph = monographId
    ? await db.monographs.get(monographId)
    : undefined;

  const metadata = monographId
    ? await db.monographs.metadata(monographId)
    : { publishUrl: "", analytics: { totalViews: 0 } };
  return {
    monograph,
    monographId,
    metadata
  };
}

const PublishNoteSheet = ({
  note,
  close
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
  const titleInput = useRef<TextInput>(null);
  const lastMonographDataResult = useRef<Awaited<
    ReturnType<typeof db.monographs.metadata>
  > | null>(null);
  const monographData = useAsync(
    async () => {
      return fetchMonographData(note?.id);
    },
    [],
    {
      onSuccess: (r) => {
        lastMonographDataResult.current = r.metadata;
      }
    }
  );
  const monograph = monographData.result?.monograph;
  const metadata = monographData.result?.metadata;
  const publishUrl = metadata?.publishUrl || monograph?.publishUrl || "";
  const isPublished = db.monographs.monograph(note?.id);
  const appState = useAppState();
  const previousAppState = useRef(appState);

  const formRef = useRef(
    createFormRef({
      title: note.title || "",
      password: ""
    })
  );

  useEffect(() => {
    if (!monographData.result) return;
    const title = monograph?.title || note.title || "";
    formRef.current.setValue("title", title);
    setTimeout(() => {
      titleInput.current?.setNativeProps({ text: title });
    }, 50);
  }, [monographData.result, monograph]);

  useEffect(() => {
    (async () => {
      if (monograph) {
        setSelfDestruct(!!monograph?.selfDestruct);
        if (monograph.password) {
          const password = await db.monographs.decryptPassword(
            monograph?.password
          );
          formRef.current.setValue("password", password);
          setIsLocked(!!monograph?.password);
        }
      }
    })();
  }, [monograph]);

  const publishNote = async () => {
    if (publishing) return;
    formRef.current.clearErrors();

    if (!formRef.current.validate()) return;

    const values = formRef.current.getValues();

    setPublishLoading(true);

    try {
      if (note?.id) {
        await db.monographs.publish(note.id, values.title, {
          selfDestruct,
          password: values.password || undefined
        });
        await monographData.execute();
        Navigation.queueRoutesForUpdate();
        eSendEvent(eMenuItemUpdate);
      }
      requestInAppReview();
    } catch (e) {
      ToastManager.show({
        heading: strings.failedToPublish(),
        message: (e as Error).message,
        type: "error",
        context: "local"
      });
    } finally {
      setPublishLoading(false);
    }
  };
  const setPublishLoading = (value: boolean) => {
    setPublishing(value);
  };

  const unpublishNote = async () => {
    if (publishing) return;
    setPublishLoading(true);
    try {
      if (note?.id) {
        await db.monographs.unpublish(note.id);
        close?.();
        // monographData.execute();
        Navigation.queueRoutesForUpdate();
        eSendEvent(eMenuItemUpdate);
        setPublishLoading(false);
        ToastManager.show({
          message: strings.noteUnpublished(),
          type: "success",
          context: "global"
        });
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

  const confirmUnpublishNote = () => {
    presentDialog({
      title: strings.unpublish() + "?",
      paragraph: strings.unpublishNoteConfirm(),
      icon: "warning-circle",
      iconFamily: "notesnook",
      iconType: "error",
      centered: true,
      positiveText: strings.yes(),
      positivePress: unpublishNote,
      context: "local"
    });
  };

  const monographMetadata =
    monographData.result?.metadata ?? lastMonographDataResult.current;

  useEffect(() => {
    const prevState = previousAppState.current;
    previousAppState.current = appState;

    if (
      appState === "active" &&
      prevState !== "active" &&
      monograph?.id &&
      !selfDestruct
    ) {
      monographData.execute();
    }
  }, [
    appState,
    monograph?.id,
    selfDestruct,
    isFeatureAvailable?.isAllowed,
    monographData
  ]);

  return (
    <View
      style={{
        width: "100%",
        alignSelf: "center",
        paddingHorizontal: Spacing.LEVEL_3,
        gap: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_3
      }}
    >
      <Dialog context="local" />
      <DialogHeader
        title={
          isPublished ? strings.editPublishedMonograph() : strings.publishNote()
        }
        paragraph={isPublished ? undefined : strings.publishNoteDesc()}
      />

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
            <View
              style={{
                gap: Spacing.LEVEL_0,
                backgroundColor: colors.selected.background,
                padding: Spacing.LEVEL_2,
                borderRadius: Radius.S,
                flexDirection: "row"
              }}
            >
              <View
                style={{
                  gap: Spacing.LEVEL_0,
                  flexGrow: 1
                }}
              >
                <Heading fontFamily="MEDIUM" fontSize="SM">
                  {strings.publishedNoteLink()}
                </Heading>
                <Paragraph
                  fontSize="SM"
                  color={colors.secondary.paragraph}
                  onPress={async () => {
                    try {
                      await openLinkInBrowser(publishUrl);
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                >
                  {monographMetadata?.publishUrl}
                </Paragraph>
              </View>

              <Button
                type="accent"
                icon="copy"
                iconFamily="notesnook"
                fontFamily="SEMI_BOLD"
                style={{
                  paddingHorizontal: Spacing.LEVEL_1,
                  paddingVertical: Spacing.LEVEL_0
                }}
                fontSize={FontSizes.XS}
                title={strings.copy()}
                onPress={() => {
                  Clipboard.setString(publishUrl as string);
                  ToastManager.show({
                    heading: strings.monographUrlCopied(),
                    type: "success",
                    context: "local"
                  });
                }}
              />
            </View>
          ) : null}

          <View
            style={{
              gap: Spacing.LEVEL_2
            }}
          >
            <FormInput
              name="title"
              formRef={formRef}
              label={strings.title()}
              fwdRef={titleInput}
              multiline
              scrollEnabled
              containerStyle={{
                maxHeight: 100
              }}
              placeholder={strings.noteTitle()}
              validators={[validators.required(strings.titleIsRequired())]}
            />

            <FormInput
              name="password"
              formRef={formRef}
              label={strings.passwordProtection()}
              fwdRef={pwdInput}
              blurOnSubmit
              secureTextEntry
              placeholder={
                isPublished
                  ? strings.enterNewPassword()
                  : strings.enterPassword()
              }
            />
          </View>

          <LineSeparator />

          <View style={{ width: "100%", gap: Spacing.LEVEL_2 }}>
            <OptionRow
              icon="clock-counter-clockwise"
              title={strings.monographSelfDestructHeading()}
              description={strings.deleteAfterViewing()}
              onPress={() => setSelfDestruct(!selfDestruct)}
              right={
                <AppIcon
                  name={selfDestruct ? "toggle-on" : "toggle-off"}
                  iconFamily="notesnook"
                  size={16}
                  color={
                    selfDestruct
                      ? [colors.primary.accent, colors.primary.background]
                      : [colors.disabled.icon, colors.primary.background]
                  }
                />
              }
            />

            {isFeatureAvailable?.isAllowed &&
            !selfDestruct &&
            monographMetadata &&
            isPublished ? (
              <OptionRow
                icon="eye-open"
                title={strings.totalViews()}
                description={strings.viewsOnPublishedNote()}
                right={
                  <Paragraph fontFamily="MEDIUM" fontSize="SM">
                    {monographMetadata?.analytics.totalViews || 0}
                  </Paragraph>
                }
              />
            ) : null}
          </View>

          <View
            style={{
              width: "100%",
              flexDirection: "row",
              gap: Spacing.LEVEL_2
            }}
          >
            {isPublished ? (
              <Button
                onPress={confirmUnpublishNote}
                style={{ flex: 1 }}
                type="error-outline"
                title={strings.unpublish()}
              />
            ) : null}

            <Button
              onPress={publishNote}
              style={{ flex: 1 }}
              type="accent"
              title={isPublished ? strings.update() : strings.publish()}
            />
          </View>
        </>
      )}

      <Paragraph
        color={colors.secondary.paragraph}
        fontSize="XS"
        style={{
          textAlign: "center"
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
        {strings.monographLearnMore[0]()}{" "}
        <Paragraph
          fontSize="XS"
          fontFamily="MEDIUM"
          color={colors.primary.accent}
        >
          {strings.monographLearnMore[1]()}
        </Paragraph>
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
