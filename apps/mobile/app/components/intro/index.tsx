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
import { Linking, ScrollView, useWindowDimensions, View } from "react-native";
import { SwiperFlatList } from "react-native-swiper-flatlist";
import { eSendEvent } from "../../services/event-manager";
import Navigation from "../../services/navigation";
import { useSettingStore } from "../../stores/use-setting-store";
import { getElevationStyle } from "../../utils/elevation";
import { eOpenLoginDialog } from "../../utils/events";
import { SIZE } from "../../utils/size";
import { AuthMode } from "../auth";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";

type IntroItem = {
  headings?: string[];
  body?: string;
  testimonial?: string;
  link?: string;
  user?: string;
};

const introItems: IntroItem[] = [
  {
    headings: ["Open source.", "End to end encrypted.", "Private."],
    body: "Write notes with freedom, no spying, no tracking."
  },
  {
    headings: ["Privacy for everyone", "— not just the", "privileged few"],
    body: "Your privacy matters to us, no matter who you are. In a world where everyone is trying to spy on you, Notesnook encrypts all your data before it leaves your device. With Notesnook no one can ever sell your data again."
  },
  {
    testimonial:
      "You simply cannot get any better of a note taking app than @notesnook. The UI is clean and slick, it is feature rich, encrypted, reasonably priced (esp. for students & educators) & open source",
    link: "https://twitter.com/andrewsayer/status/1637817220113002503",
    user: "@andrewsayer on Twitter"
  }
];

const Intro = () => {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const deviceMode = useSettingStore((state) => state.deviceMode);
  const renderItem = React.useCallback(
    ({ item }: { item: IntroItem }) => (
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

          {item.testimonial ? (
            <Paragraph
              style={{
                fontStyle: "italic",
                fontSize: SIZE.lg
              }}
              onPress={() => {
                if (!item.link) return;
                Linking.openURL(item.link);
              }}
            >
              {item.testimonial} — {item.user}
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
      contentContainerStyle={{
        minHeight: "100%"
      }}
    >
      <View
        style={{
          width: deviceMode !== "mobile" ? width / 2 : "100%",
          backgroundColor: colors.secondary.background,
          borderBottomWidth: 1,
          borderBottomColor: colors.primary.border,
          alignSelf: deviceMode !== "mobile" ? "center" : undefined,
          borderWidth: deviceMode !== "mobile" ? 1 : undefined,
          borderColor:
            deviceMode !== "mobile" ? colors.primary.border : undefined,
          borderRadius: deviceMode !== "mobile" ? 20 : undefined,
          marginTop: deviceMode !== "mobile" ? 50 : undefined,
          flexGrow: 2
        }}
      >
        <SwiperFlatList
          autoplay
          autoplayDelay={10}
          autoplayLoop={true}
          index={0}
          useReactNativeGestureHandler={true}
          showPagination
          data={introItems}
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
          paddingHorizontal: 16,
          gap: 12,
          paddingVertical: 16
        }}
      >
        <Button
          width="100%"
          onPress={() => {
            eSendEvent(eOpenLoginDialog, AuthMode.welcomeSignup);
            setTimeout(() => {
              // SettingsService.set({
              //   introCompleted: true
              // });
              Navigation.replace("Notes", {
                canGoBack: false
              });
            }, 1000);
          }}
          style={{
            paddingHorizontal: 24,
            alignSelf: "center",
            ...getElevationStyle(5)
          }}
          fontSize={SIZE.md}
          type="accent"
          title="Get started"
        />

        <Button
          width="100%"
          title="I already have an account"
          type="secondary"
          onPress={() => {
            eSendEvent(eOpenLoginDialog, AuthMode.login);
            setTimeout(() => {
              // SettingsService.set({
              //   introCompleted: true
              // });
              Navigation.replace("Notes", {
                canGoBack: false
              });
            }, 1000);
          }}
        />
      </View>
    </ScrollView>
  );
};

export default Intro;
