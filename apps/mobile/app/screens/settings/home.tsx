import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
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
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { SectionGroup } from "./section-group";
import { settingsGroups } from "./settings-data";
import { RouteParams, SettingSection } from "./types";
import SettingsUserSection from "./user-section";
const keyExtractor = (item: SettingSection) => item.id;

const Home = ({
  navigation
}: NativeStackScreenProps<RouteParams, "SettingsHome">) => {
  const colors = useThemeStore((state) => state.colors);
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
      <View>
        {loading && (
          //@ts-ignore
          <BaseDialog animated={false} bounce={false} visible={true}>
            <View
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: colors.bg,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              <Heading color={colors.pri} size={SIZE.lg}>
                Logging out
              </Heading>
              <Paragraph color={colors.icon}>
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
                  unfilledColor={colors.nav}
                  color={colors.accent}
                  borderWidth={0}
                />
              </View>
            </View>
          </BaseDialog>
        )}

        <Animated.FlatList
          entering={FadeInDown}
          exiting={FadeOutDown}
          data={settingsGroups}
          keyExtractor={keyExtractor}
          ListFooterComponent={<View style={{ height: 200 }} />}
          renderItem={renderItem}
        />
      </View>
    </DelayLayout>
  );
};

export default Home;
