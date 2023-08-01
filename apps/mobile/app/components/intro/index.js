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

import { useThemeColors } from "@notesnook/theme";
import React from "react";
import {
  Linking,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";
import { SwiperFlatList } from "react-native-swiper-flatlist";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getElevationStyle } from "../../utils/elevation";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import SettingsService from "../../services/settings";
import { useSettingStore } from "../../stores/use-setting-store";
import { SIZE } from "../../utils/size";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

const Intro = ({ navigation }) => {
  const { colors } = useThemeColors();
  const isTelemetryEnabled = useSettingStore(
    (state) => state.settings.telemetry
  );
  const { width, height } = useWindowDimensions();
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const insets = useGlobalSafeAreaInsets();
  const renderItem = React.useCallback(
    ({ item }) => (
      <View
        style={{
          justifyContent: "center",
          width: deviceMode !== "mobile" ? width / 2 : width,
          paddingHorizontal:
            deviceMode !== "mobile" ? (width / 2) * 0.05 : width * 0.05
        }}
      >
        <View
          style={{
            flexDirection: "row"
          }}
        >
          <View
            style={{
              width: 100,
              height: 5,
              backgroundColor: colors.primary.accent,
              borderRadius: 2,
              marginRight: 7
            }}
          />

          <View
            style={{
              width: 20,
              height: 5,
              backgroundColor: colors.secondary.background,
              borderRadius: 2
            }}
          />
        </View>
        <View
          style={{
            marginTop: 10,
            maxWidth: "90%",
            width: "100%"
          }}
        >
          {item.headings?.map((heading) => (
            <Heading
              key={heading}
              style={{
                marginBottom: 5
              }}
              extraBold
              size={SIZE.xxl}
            >
              {heading}
            </Heading>
          ))}

          {item.body ? <Paragraph size={SIZE.sm}>{item.body}</Paragraph> : null}

          {item.tesimonial ? (
            <Paragraph
              style={{
                fontStyle: "italic",
                fontSize: SIZE.lg
              }}
              onPress={() => {
                Linking.openURL(item.link);
              }}
            >
              {item.tesimonial} — {item.user}
            </Paragraph>
          ) : null}
        </View>
      </View>
    ),
    [colors.primary.accent, colors.secondary.background, deviceMode, width]
  );

  return (
    <ScrollView
      testID="notesnook.splashscreen"
      style={{
        width: "100%"
      }}
    >
      <View
        style={{
          width: deviceMode !== "mobile" ? width / 2 : "100%",
          backgroundColor: colors.secondary.background,
          marginBottom: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary.border,
          alignSelf: deviceMode !== "mobile" ? "center" : undefined,
          borderWidth: deviceMode !== "mobile" ? 1 : null,
          borderColor: deviceMode !== "mobile" ? colors.primary.border : null,
          borderRadius: deviceMode !== "mobile" ? 20 : null,
          marginTop: deviceMode !== "mobile" ? 50 : null,
          paddingTop: insets.top + 10,
          paddingBottom: insets.top + 10,
          minHeight: height * 0.7
        }}
      >
        <SwiperFlatList
          autoplay
          autoplayDelay={10}
          autoplayLoop={true}
          index={0}
          useReactNativeGestureHandler={true}
          showPagination
          data={[
            {
              headings: ["Open source.", "End to end encrypted.", "Private."],
              body: "Write notes with freedom, no spying, no tracking."
            },
            {
              headings: [
                "Privacy for everyone",
                "— not just the",
                "privileged few"
              ],
              body: "Your privacy matters to us, no matter who you are. In a world where everyone is trying to spy on you, Notesnook encrypts all your data before it leaves your device. With Notesnook no one can ever sell your data again."
            },
            {
              tesimonial:
                "You simply cannot get any better of a note taking app than @notesnook. The UI is clean and slick, it is feature rich, encrypted, reasonably priced (esp. for students & educators) & open source",
              link: "https://twitter.com/andrewsayer/status/1637817220113002503",
              user: "@andrewsayer on Twitter"
            }
          ]}
          paginationActiveColor={colors.primary.accent}
          paginationStyleItem={{
            width: 10,
            height: 5,
            marginRight: 4,
            marginLeft: 4
          }}
          paginationDefaultColor={colors.primary.border}
          renderItem={renderItem}
        />
      </View>

      <View
        style={{
          width: "100%",
          justifyContent: "center",
          minHeight: height * 0.3
        }}
      >
        <Button
          width={250}
          onPress={async () => {
            navigation.navigate("AppLock", {
              welcome: true
            });
          }}
          style={{
            paddingHorizontal: 24,
            alignSelf: "center",
            ...getElevationStyle(5),
            borderRadius: 100
          }}
          fontSize={SIZE.md}
          type="accent"
          title="Get started"
        />

        <TouchableOpacity
          activeOpacity={1}
          style={{
            flexDirection: "row",
            alignSelf: "center",
            width: "90%",
            marginBottom: 12,
            paddingHorizontal: 12,
            justifyContent: "center",
            padding: 12,
            maxWidth: 500
          }}
          onPress={() => {
            SettingsService.set({ telemetry: !isTelemetryEnabled });
          }}
        >
          <Icon
            size={SIZE.md}
            name={
              isTelemetryEnabled ? "checkbox-marked" : "checkbox-blank-outline"
            }
            color={
              isTelemetryEnabled ? colors.primary.accent : colors.primary.icon
            }
          />

          <Paragraph
            style={{
              flexShrink: 1,
              marginLeft: 6
            }}
            size={SIZE.xs}
          >
            Help improve Notesnook by sending completely anonymized{" "}
            <Heading size={SIZE.xs}>private analytics and bug reports.</Heading>
          </Paragraph>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Intro;
