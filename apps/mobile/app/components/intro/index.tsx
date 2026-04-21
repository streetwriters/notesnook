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
import { Linking, Platform, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing } from "../../common/design/spacing";
import useRotator from "../../hooks/use-rotator";
import Navigation from "../../services/navigation";
import SettingsService from "../../services/settings";
import { AuthMode } from "../auth/common";
import { Button } from "../ui/button";
import Heading from "../ui/typography/heading";
import Paragraph from "../ui/typography/paragraph";
import { IntroIllustration } from "./illustration";
import { ProgressPills } from "./progress-pills";
import useGlobalSafeAreaInsets from "../../hooks/use-global-safe-area-insets";

const Intro = () => {
  const { colors } = useThemeColors();
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const rotator = useRotator([0, 1, 2], 10000, true);
  const insets = useGlobalSafeAreaInsets();

  const renderItem = React.useCallback(
    ({ item }: { item: (typeof strings.introData)[0] }) => (
      <Animated.View
        entering={FadeIn}
        exiting={FadeOut}
        style={{
          justifyContent: "flex-start"
        }}
      >
        <View
          style={{
            gap: Spacing.LEVEL_2
          }}
        >
          {item.headings?.map((heading, index) =>
            heading.bold ? (
              <Heading
                key={heading.value()}
                fontFamily="SEMI_BOLD"
                fontSize="XXL"
                style={{
                  marginTop: index !== 0 ? -5 : undefined
                }}
              >
                {heading.value()}
              </Heading>
            ) : (
              <Paragraph
                style={{
                  marginTop: index !== 0 ? -5 : undefined
                }}
                fontFamily="MEDIUM"
                fontSize="XL"
              >
                {heading.value()}
              </Paragraph>
            )
          )}

          {item.user ? (
            <Paragraph fontFamily="MEDIUM" fontSize="XL">
              {item.user}
            </Paragraph>
          ) : null}

          {item.body ? (
            <Paragraph color={colors.secondary.paragraph} fontSize="SM">
              {item.body()}
            </Paragraph>
          ) : null}

          {item.tesimonial ? (
            <Paragraph
              fontSize="SM"
              color={colors.secondary.paragraph}
              onPress={() => {
                // Linking.openURL(item.link);
              }}
            >
              {item.tesimonial()}
            </Paragraph>
          ) : null}
        </View>
      </Animated.View>
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
          flex: 1,
          paddingTop: Platform.OS === "android" ? 60 - insets.top : undefined
        }}
      >
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: Spacing.LEVEL_3
          }}
        >
          <ProgressPills activePillIndex={0} />
        </View>

        <View
          style={[
            {
              width: "100%",
              borderBottomWidth: 1,
              borderBottomColor: colors.primary.border,
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
          <View
            style={{
              alignItems: "center",
              alignSelf: "center",
              paddingVertical: Spacing.LEVEL_7
            }}
          >
            <IntroIllustration />
          </View>

          <View
            style={{
              paddingHorizontal: Spacing.LEVEL_3
            }}
          >
            {strings.introData.map((item, index) =>
              index !== rotator ? null : renderItem({ item })
            )}
          </View>
        </View>
      </View>

      <View
        style={{
          width: isTablet ? "50%" : "100%",
          justifyContent: "center",
          gap: Spacing.LEVEL_2,
          padding: Spacing.LEVEL_3,
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
          title={strings.continue()}
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
