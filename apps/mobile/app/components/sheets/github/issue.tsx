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

import { Debug, IssueReportResponse } from "@notesnook/core";
import { getModel, getBrand, getSystemVersion } from "react-native-device-info";
import { useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import { Linking, Platform, Text, TextInput, View } from "react-native";
import { getVersion } from "react-native-device-info";
import { useStoredRef } from "../../../hooks/use-stored-ref";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import PremiumService from "../../../services/premium";
import { useUserStore } from "../../../stores/use-user-store";
import { openLinkInBrowser } from "../../../utils/functions";
import { defaultBorderRadius, AppFontSize } from "../../../utils/size/index";
import DialogHeader from "../../dialog/dialog-header";
import { Button } from "../../ui/button";
import Seperator from "../../ui/seperator";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";
import { strings } from "@notesnook/intl";
import { DefaultAppStyles } from "../../../utils/styles";
import Config from "react-native-config";
import { eCloseSheet } from "../../../utils/events";

export const Issue = ({
  defaultTitle,
  defaultBody,
  issueTitle
}: {
  defaultTitle?: string;
  defaultBody?: string;
  issueTitle?: string;
}) => {
  const { colors } = useThemeColors();
  const body = useStoredRef("issueBody", "");
  const title = useStoredRef("issueTitle", defaultTitle);
  const [done, setDone] = useState(false);
  const user = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(false);
  const bodyRef = useRef<TextInput>(null);
  const initialLayout = useRef(false);
  const issueReportResponse = useRef<IssueReportResponse>(undefined);

  const onPress = async () => {
    if (loading) return;
    if (!title.current || !body.current) return;
    if (title.current?.trim() === "" || body.current?.trim().length === 0)
      return;

    try {
      setLoading(true);
      issueReportResponse.current = await Debug.report({
        title: title.current,
        body:
          body.current +
          `\n${defaultBody || ""}` +
          `\n_______________
**Device information:**
App version: ${getVersion()}
Platform: ${Platform.OS}
Device: ${getBrand() || ""}-${getModel() || ""}-${getSystemVersion() || ""}
Pro: ${PremiumService.get()}
Logged in: ${user ? "yes" : "no"}
Github Release: ${Config.GITHUB_RELEASE === "true" ? "Yes" : "No"}`,
        userId: user?.id
      });
      if (!issueReportResponse.current) {
        setLoading(false);
        ToastManager.show({
          heading: "Failed to report issue on github",
          type: "error",
          context: "local"
        });
        return;
      }
      setLoading(false);
      body.reset();
      title.reset();
      setDone(true);
    } catch (e) {
      setLoading(false);
      ToastManager.show({
        heading: (e as Error).message,
        type: "error"
      });
    }
  };

  function getResponseInfo(response?: IssueReportResponse) {
    if (!response || "error" in response) return;
    switch (response.type) {
      case "email": {
        return {
          title: strings.yourSupportRequestHasBeenForwarded(),
          message: strings.supportEmailMessage()
        };
      }
      case "discussion": {
        const url = response.url;
        return {
          title: strings.thankYouForFeedback(),
          positiveButtonText: strings.copyLink(),
          message: strings.featureRequestMessage(url),
          url: url
        };
      }
      case "issue": {
        const url = response.url;
        return {
          title: strings.thankYouForReporting(),
          positiveButtonText: strings.copyLink(),
          message: strings.bugReportMessage(url),
          url: url
        };
      }
    }
  }

  const responseInfo = getResponseInfo(issueReportResponse.current);

  console.log(responseInfo, issueReportResponse.current);

  return (
    <View
      style={{
        paddingHorizontal: DefaultAppStyles.GAP,
        width: "100%"
      }}
    >
      {done ? (
        <>
          <View
            style={{
              justifyContent: "center",
              alignItems: "center",
              gap: 10
            }}
          >
            <Heading>{responseInfo?.title}</Heading>
            <Paragraph
              style={{
                textAlign: "center"
              }}
              selectable={true}
            >
              {responseInfo?.message}
            </Paragraph>

            <Button
              title={responseInfo?.positiveButtonText || "Done"}
              onPress={() => {
                if (responseInfo?.url) {
                  Linking.openURL(responseInfo?.url);
                }
                eSendEvent(eCloseSheet);
              }}
              type="accent"
              width="100%"
            />
          </View>
        </>
      ) : (
        <>
          <DialogHeader
            title={issueTitle || strings.issueTitle()}
            paragraph={issueTitle ? strings.issueDesc() : strings.issueDesc2()}
          />

          <Seperator half />

          <TextInput
            placeholder={strings.title()}
            onChangeText={(v) => (title.current = v)}
            defaultValue={title.current}
            style={{
              borderWidth: 1,
              borderColor: colors.primary.border,
              borderRadius: defaultBorderRadius,
              padding: DefaultAppStyles.GAP,
              fontFamily: "Inter-Regular",
              marginBottom: DefaultAppStyles.GAP_VERTICAL,
              fontSize: AppFontSize.md,
              color: colors.primary.heading
            }}
            placeholderTextColor={colors.primary.placeholder}
          />

          <TextInput
            ref={bodyRef}
            multiline
            placeholder={strings.issuePlaceholder()}
            numberOfLines={5}
            textAlignVertical="top"
            onChangeText={(v) => (body.current = v)}
            onLayout={() => {
              if (initialLayout.current) return;
              initialLayout.current = true;
              if (body.current) {
                bodyRef.current?.setNativeProps({
                  text: body.current,
                  selection: {
                    start: 0,
                    end: 0
                  }
                });
              }
            }}
            style={{
              borderWidth: 1,
              borderColor: colors.primary.border,
              borderRadius: defaultBorderRadius,
              padding: DefaultAppStyles.GAP,
              fontFamily: "Inter-Regular",
              maxHeight: 200,
              fontSize: AppFontSize.sm,
              marginBottom: 2.5,
              color: colors.primary.paragraph
            }}
            placeholderTextColor={colors.primary.placeholder}
          />
          <Paragraph
            size={AppFontSize.xs}
            color={colors.secondary.paragraph}
          >{`App version: ${getVersion()} Platform: ${
            Platform.OS
          } Model: ${getBrand()}-${getModel()}-${getSystemVersion()}`}</Paragraph>

          <Seperator />
          <Button
            onPress={onPress}
            title={loading ? null : strings.submit()}
            loading={loading}
            width="100%"
            type="accent"
          />

          <Paragraph
            color={colors.secondary.paragraph}
            size={AppFontSize.xs}
            style={{
              marginTop: DefaultAppStyles.GAP_VERTICAL,
              textAlign: "center"
            }}
          >
            {strings.issueNotice[0]()}{" "}
            <Text
              onPress={() => {
                Linking.openURL(
                  "https://github.com/streetwriters/notesnook/issues"
                );
              }}
              style={{
                textDecorationLine: "underline",
                color: colors.primary.accent
              }}
            >
              github.com/streetwriters/notesnook.
            </Text>{" "}
            {strings.issueNotice[1]()}{" "}
            <Text
              style={{
                textDecorationLine: "underline",
                color: colors.primary.accent
              }}
              onPress={async () => {
                try {
                  await openLinkInBrowser("https://discord.gg/zQBK97EE22");
                } catch (e) {
                  console.error(e);
                }
              }}
            >
              {strings.issueNotice[2]()}
            </Text>
          </Paragraph>
        </>
      )}
    </View>
  );
};
