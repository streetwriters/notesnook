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

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import DelayLayout from "../../components/delay-layout";
import BaseDialog from "../../components/dialog/base-dialog";
import { ProgressBarComponent } from "../../components/ui/svg/lazy";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import {
  eSubscribeEvent,
  eUnSubscribeEvent
} from "../../services/event-manager";
import useNavigationStore from "../../stores/use-navigation-store";
import { useThemeColors } from "@notesnook/theme";
import { SIZE } from "../../utils/size";
import { SectionGroup } from "./section-group";
import { settingsGroups } from "./settings-data";
import { RouteParams, SettingSection } from "./types";
import SettingsUserSection from "./user-section";
const keyExtractor = (item: SettingSection) => item.id;

const Home = ({
  navigation
}: NativeStackScreenProps<RouteParams, "SettingsHome">) => {
  const { colors } = useThemeColors();
  const [loading, setLoading] = useState(false);

  useNavigationFocus(navigation, {
    onFocus: () => {
      useNavigationStore.getState().update({
        name: "Settings"
      });
      return false;
    },
    focusOnInit: true
  });

  const renderItem = ({ item }: { item: SettingSection; index: number }) =>
    item.name === "account" ? (
      <SettingsUserSection item={item} />
    ) : (
      <SectionGroup item={item} />
    );

  useEffect(() => {
    function settingsLoading(state: boolean) {
      setLoading(state || true);
    }
    eSubscribeEvent("settings-loading", settingsLoading);
    return () => {
      eUnSubscribeEvent("settings-loading", settingsLoading);
    };
  }, []);

  return (
    <DelayLayout delay={300} type="settings">
      {loading && (
        //@ts-ignore // Migrate to typescript required.
        <BaseDialog animated={false} bounce={false} visible={true}>
          <View
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: colors.primary.background,
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: colors.primary.background,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Heading color={colors.primary.paragraph} size={SIZE.lg}>
                Logging out
              </Heading>
              <Paragraph color={colors.secondary.paragraph}>
                Please wait while we log out and clear app data.
              </Paragraph>
              <View
                style={{
                  flexDirection: "row",
                  width: 100,
                  marginTop: 15
                }}
              >
                <ProgressBarComponent
                  height={5}
                  width={100}
                  animated={true}
                  useNativeDriver
                  indeterminate
                  indeterminateAnimationDuration={2000}
                  unfilledColor={colors.secondary.background}
                  color={colors.primary.accent}
                  borderWidth={0}
                />
              </View>
            </View>
          </View>
        </BaseDialog>
      )}

      <Animated.FlatList
        entering={FadeInDown}
        data={settingsGroups}
        windowSize={1}
        keyExtractor={keyExtractor}
        ListFooterComponent={<View style={{ height: 200 }} />}
        renderItem={renderItem}
      />
    </DelayLayout>
  );
};

export default Home;
