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

import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React, { RefObject, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  useWindowDimensions,
  View
} from "react-native";
import { ActionSheetRef, ScrollView } from "react-native-actions-sheet";
import { checkVersion, CheckVersionResponse } from "react-native-check-version";
import Config from "react-native-config";
import deviceInfoModule from "react-native-device-info";
import { Radius, Spacing } from "../../../common/design/spacing";
import { STORE_LINK } from "../../../utils/constants";
import { GithubVersionInfo } from "../../../utils/github-version";
import AppIcon from "../../ui/AppIcon";
import { Button } from "../../ui/button";
import Heading from "../../ui/typography/heading";
import Paragraph from "../../ui/typography/paragraph";

type UpdateVersion = GithubVersionInfo | CheckVersionResponse;

type VersionInfo = {
  version?: string | null;
  needsUpdate?: boolean;
  notes?: string;
  body?: string;
};

type UpdateProps = {
  version?: UpdateVersion;
  fwdRef?: RefObject<ActionSheetRef>;
};

type IconTileProps = {
  colors: ReturnType<typeof useThemeColors>["colors"];
  name: string;
  color?: string;
  backgroundColor?: string;
};

const IconTile = ({ colors, name, color, backgroundColor }: IconTileProps) => (
  <View
    style={{
      width: 32,
      height: 32,
      borderRadius: Radius.XS,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: backgroundColor || colors.secondary.background
    }}
  >
    <AppIcon
      name={name}
      iconFamily="notesnook"
      size={16}
      color={color || colors.primary.icon}
    />
  </View>
);

export const Update = ({ version: appVersion }: UpdateProps) => {
  const { colors } = useThemeColors();
  const { height } = useWindowDimensions();
  const [version, setVersion] = useState<VersionInfo | undefined>(appVersion);
  let notes = version?.notes
    ? version.notes.replace("Thank you for using Notesnook!", "").split("- ")
    : ["Bug fixes and performance improvements"];
  notes = notes?.map((n) => n.replace(/\n|<br>/g, ""));
  const isGithubRelease = Config.GITHUB_RELEASE === "true";

  const getSupportedAbi = () => {
    const abi = deviceInfoModule.supportedAbisSync();
    const armv8a = abi.find((a) => a === "arm64-v8a");
    const armv7 = abi.find((a) => a === "armeabi-v7a");

    return armv8a || armv7 || abi[0];
  };

  const GITHUB_URL =
    !version || !version.needsUpdate
      ? null
      : `https://github.com/streetwriters/notesnook/releases/download/${
          version.version
        }-android/notesnook-${getSupportedAbi()}.apk`;
  const GITHUB_PAGE_URL =
    !version || !version.needsUpdate
      ? null
      : `https://github.com/streetwriters/notesnook/releases/tag/${version.version}-android`;

  useEffect(() => {
    if (!version) {
      (async () => {
        try {
          const v = await checkVersion();
          setVersion(v);
        } catch (e) {
          setVersion({
            needsUpdate: false
          });
        }
      })();
    }
  }, [version]);

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
      {!version || !version?.needsUpdate ? (
        <View
          style={{
            alignItems: "center",
            justifyContent: "center",
            gap: Spacing.LEVEL_2,
            paddingBottom: Spacing.LEVEL_6
          }}
        >
          {!version ? (
            <>
              <ActivityIndicator
                style={{
                  marginTop: Spacing.LEVEL_4
                }}
                color={colors.primary.accent}
              />
              <Paragraph fontSize="MD" color={colors.secondary.paragraph}>
                {strings.checkNewVersion()}
              </Paragraph>
            </>
          ) : (
            <>
              <IconTile colors={colors} name="warning-circle" />
              <View
                style={{
                  alignItems: "center",
                  gap: Spacing.LEVEL_1
                }}
              >
                <Heading fontSize="XL" lineHeight="100%">
                  {strings.noUpdates()}
                </Heading>
                <Paragraph
                  fontSize="SM"
                  color={colors.secondary.paragraph}
                  style={{ textAlign: "center" }}
                >
                  {strings.noUpdatesDesc()}
                </Paragraph>
              </View>
            </>
          )}
        </View>
      ) : (
        <>
          <View
            style={{
              flexDirection: "column",
              alignItems: "center",
              gap: Spacing.LEVEL_2,
              justifyContent: "center"
            }}
          >
            <IconTile colors={colors} name="download-simple" />
            <View
              style={{
                justifyContent: "center",
                gap: Spacing.LEVEL_1
              }}
            >
              <Heading fontSize="XL" lineHeight="100%">
                {strings.updateAvailable()}
              </Heading>
              <Paragraph fontSize="SM" color={colors.secondary.paragraph}>
                {strings.versionReleased(
                  version.version as string,
                  isGithubRelease ? "github" : "store"
                )}
              </Paragraph>
            </View>
          </View>

          <View
            style={{
              height: 1,
              backgroundColor: colors.primary.separator
            }}
          />

          <ScrollView
            nestedScrollEnabled={true}
            style={{
              width: "100%",
              maxHeight: height * 0.4
            }}
          >
            <Heading fontSize="MD" lineHeight="100%">
              {strings.releaseNotes()}
            </Heading>

            {version.body ? (
              <Paragraph
                color={colors.secondary.paragraph}
                style={{
                  marginTop: Spacing.LEVEL_2,
                  marginBottom: Spacing.LEVEL_0,
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 20
                }}
                selectable
              >
                {version.body}
              </Paragraph>
            ) : (
              <View
                style={{
                  marginTop: Spacing.LEVEL_2,
                  gap: Spacing.LEVEL_0
                }}
              >
                {notes.map((item) =>
                  item && item !== "" ? (
                    <Paragraph
                      key={item}
                      color={colors.secondary.paragraph}
                      selectable
                    >
                      {`• ${item}`}
                    </Paragraph>
                  ) : null
                )}
              </View>
            )}
          </ScrollView>

          <Button
            title={
              isGithubRelease ? strings.downloadUpdate() : strings.update()
            }
            onPress={() => {
              Linking.openURL(
                (isGithubRelease ? GITHUB_URL : STORE_LINK) as string
              ).catch(console.log);
            }}
            type="accent"
            style={{
              width: "100%",
              borderRadius: Radius.S
            }}
          />

          <Paragraph
            fontSize="XS"
            color={colors.secondary.paragraph}
            style={{
              textAlign: "center"
            }}
            onPress={() => {
              Linking.openURL(GITHUB_PAGE_URL as string).catch(() => {
                /* empty */
              });
            }}
          >
            {strings.readReleaseNotes[1]()}
            <Paragraph
              color={colors.primary.accent}
              fontFamily="MEDIUM"
              fontSize="XS"
            >
              {strings.readReleaseNotes[2]()}
            </Paragraph>
          </Paragraph>
        </>
      )}
    </View>
  );
};
