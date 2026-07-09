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
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { useRef, useState } from "react";
import { Linking, Platform, View } from "react-native";
import Config from "react-native-config";
import {
  getBrand,
  getModel,
  getSystemVersion,
  getVersion
} from "react-native-device-info";
import { Radius, Spacing } from "../../../common/design/spacing";
import { useStoredRef } from "../../../hooks/use-stored-ref";
import { eSendEvent, ToastManager } from "../../../services/event-manager";
import PremiumService from "../../../services/premium";
import { useUserStore } from "../../../stores/use-user-store";
import { eCloseSheet } from "../../../utils/events";
import { openLinkInBrowser } from "../../../utils/functions";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import {
  createFormRef,
  FormInput,
  validators
} from "../../ui/input/form-input";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

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
  const formRef = useRef(
    createFormRef({
      title: title.current || "",
      body: body.current || ""
    })
  );
  const issueReportResponse = useRef<IssueReportResponse>(undefined);

  const onPress = async () => {
    if (loading) return;
    if (!formRef.current.validate()) return;

    const titleValue = formRef.current.getValue("title").trim();
    const bodyValue = formRef.current.getValue("body").trim();

    try {
      setLoading(true);
      issueReportResponse.current = await Debug.report({
        title: titleValue,
        body:
          bodyValue +
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
      formRef.current.setValue("title", "");
      formRef.current.setValue("body", "");
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

  return (
    <View
      style={{
        width: "100%",
        backgroundColor: colors.primary.background,
        borderTopLeftRadius: 35,
        borderTopRightRadius: 35,
        paddingHorizontal: Spacing.LEVEL_3,
        paddingTop: Spacing.LEVEL_2,
        gap: Spacing.LEVEL_3
      }}
    >
      {done ? (
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            gap: Spacing.LEVEL_2,
            paddingVertical: Spacing.LEVEL_3
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
            title={responseInfo?.positiveButtonText || strings.done()}
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
      ) : (
        <>
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              gap: Spacing.LEVEL_1
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: Radius.XS,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: colors.error.background
              }}
            >
              <AppIcon
                name="warning-circle"
                iconFamily="notesnook"
                size={16}
                color={colors.error.accent}
              />
            </View>

            <View
              style={{
                flex: 1,
                justifyContent: "center",
                gap: Spacing.LEVEL_1
              }}
            >
              <Heading fontSize="XL" lineHeight="100%">
                {issueTitle || strings.issueTitle()}
              </Heading>
              <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
                {issueTitle ? strings.issueDesc() : strings.issueDesc2()}
              </Paragraph>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.primary.separator
            }}
          />

          <View
            style={{
              gap: Spacing.LEVEL_3
            }}
          >
            <View
              style={{
                gap: Spacing.LEVEL_2
              }}
            >
              <FormInput
                name="title"
                formRef={formRef}
                label={strings.issueSummary()}
                placeholder={strings.issueTitlePlaceholder()}
                defaultValue={title.current}
                validators={[validators.required(strings.allFieldsRequired())]}
                onChangeText={(v) => (title.current = v)}
                containerStyle={{
                  borderRadius: Radius.XS
                }}
              />

              <FormInput
                name="body"
                formRef={formRef}
                label={strings.details()}
                placeholder={strings.issuePlaceholder()}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                validators={[validators.required(strings.allFieldsRequired())]}
                onChangeText={(v) => (body.current = v)}
                containerStyle={{
                  borderRadius: Radius.XS,
                  alignItems: "flex-start"
                }}
                inputStyle={{
                  minHeight: 100
                }}
              />
            </View>

            <Button
              onPress={onPress}
              title={loading ? null : strings.submit()}
              loading={loading}
              width="100%"
              type="error"
              style={{
                borderRadius: Radius.S,
                borderColor: colors.error.border
              }}
            />

            <Paragraph
              color={colors.secondary.paragraph}
              fontSize="XS"
              style={{
                textAlign: "center"
              }}
            >
              {strings.issueNotice[0]()}{" "}
              <Paragraph
                onPress={() => {
                  Linking.openURL(
                    "https://github.com/streetwriters/notesnook/issues"
                  );
                }}
                fontSize="XS"
                fontFamily="MEDIUM"
                style={{
                  color: colors.primary.accent
                }}
              >
                Github.
              </Paragraph>{" "}
              {strings.issueNotice[1]()}{" "}
              <Paragraph
                style={{
                  color: colors.primary.accent
                }}
                fontSize="XS"
                fontFamily="MEDIUM"
                onPress={async () => {
                  try {
                    await openLinkInBrowser("https://discord.gg/zQBK97EE22");
                  } catch (e) {
                    console.error(e);
                  }
                }}
              >
                {strings.issueNotice[2]()}
              </Paragraph>
            </Paragraph>
          </View>
        </>
      )}
    </View>
  );
};
