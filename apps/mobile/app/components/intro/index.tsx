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
import React from "react";
import { Linking, useWindowDimensions, View } from "react-native";
import { SwiperFlatList } from "react-native-swiper-flatlist";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";
import Navigation from "../../services/navigation";
import { AppFontSize } from "../../utils/size";
import { DefaultAppStyles } from "../../utils/styles";
import { AuthMode } from "../auth/common";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import SettingsService from "../../services/settings";
import { SafeAreaView } from "react-native-safe-area-context";

const Intro = () => {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const insets = useGlobalSafeAreaInsets();
  const isTablet = width > 600;

  const renderItem = React.useCallback(
    ({ item }: { item: (typeof strings.introData)[0] }) => (
      <View
        style={{
          justifyContent: "center",
          width: isTablet ? width / 2 : width,
          paddingHorizontal: isTablet ? (width / 2) * 0.05 : width * 0.05
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
            marginTop: DefaultAppStyles.GAP_VERTICAL,
            maxWidth: "90%",
            width: "100%"
          }}
        >
          {item.headings?.map((heading) => (
            <Heading
              key={heading()}
              style={{
                marginBottom: 5
              }}
              extraBold
              size={AppFontSize.xxl}
            >
              {heading()}
            </Heading>
          ))}

          {item.body ? (
            <Paragraph size={AppFontSize.sm}>{item.body()}</Paragraph>
          ) : null}

          {item.tesimonial ? (
            <Paragraph
              style={{
                fontStyle: "italic",
                fontSize: AppFontSize.lg
              }}
              onPress={() => {
                Linking.openURL(item.link);
              }}
            >
              {item.tesimonial()} — {item.user}
            </Paragraph>
          ) : null}
        </View>
      </View>
    ),
    [colors.primary.accent, colors.secondary.background, isTablet, width]
  );

  return (
    <SafeAreaView
      style={{
        flex: 1,
        height: "100%",
        backgroundColor: colors.primary.background
      }}
    >
      <View
        testID="notesnook.splashscreen"
        style={{
          flex: 1
        }}
      >
        <View
          style={[
            {
              width: "100%",
              borderBottomWidth: 1,
              borderBottomColor: colors.primary.border,
              paddingTop: insets.top + 10,
              paddingBottom: insets.top + 10,
              flexGrow: 1
            },
            isTablet && {
              width: width / 2,
              alignSelf: "center",
              borderWidth: 1,
              borderColor: colors.primary.border,
              borderRadius: 20,
              marginTop: 50
            }
          ]}
        >
          <SwiperFlatList
            autoplay
            autoplayDelay={10}
            autoplayLoop={true}
            index={0}
            useReactNativeGestureHandler={true}
            showPagination
            data={strings.introData}
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
      </View>
      <View
        style={{
          width: isTablet ? "50%" : "100%",
          justifyContent: "center",
          gap: DefaultAppStyles.GAP_VERTICAL,
          paddingHorizontal: isTablet ? 0 : DefaultAppStyles.GAP,
          paddingVertical: DefaultAppStyles.GAP_VERTICAL,
          flexShrink: 1,
          alignSelf: "center"
        }}
      >
        <Button
          style={{
            width: "100%"
          }}
          onPress={async () => {
            SettingsService.set({ introCompleted: true });
            Navigation.push("Auth", {
              mode: AuthMode.welcomeSignup
            });
          }}
          type="accent"
          title={strings.getStarted()}
        />

        <Button
          style={{
            width: "100%"
          }}
          title={strings.iAlreadyHaveAnAccount()}
          type="secondary"
          onPress={() => {
            SettingsService.set({
              introCompleted: true
            });
            Navigation.push("Auth", {
              mode: AuthMode.welcomeLogin,
              context: "intro"
            });
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default Intro;
