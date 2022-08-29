import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import DelayLayout from "../../components/delay-layout";
import { useNavigationFocus } from "../../hooks/use-navigation-focus";
import useNavigationStore from "../../stores/use-navigation-store";
import { tabBarRef } from "../../utils/global-refs";
import { components } from "./components";
import { SectionItem } from "./section-item";
import { RouteParams, SettingSection } from "./types";
const keyExtractor = (item: SettingSection) => item.id;

const Group = ({
  navigation,
  route
}: NativeStackScreenProps<RouteParams, "SettingsGroup">) => {
  useNavigationFocus(navigation, {
    onFocus: () => {
      tabBarRef.current?.lock();
      console.log("called");
      useNavigationStore.getState().update(
        {
          name: "SettingsGroup",
          //@ts-ignore
          title: route.params.name
        },
        true
      );
      return false;
    }
  });
  useEffect(() => {
    return () => {
      tabBarRef.current?.unlock();
    };
  }, []);
  const renderItem = ({ item }: { item: SettingSection; index: number }) => (
    <SectionItem item={item} />
  );

  return (
    <DelayLayout type="settings" delay={300}>
      <View
        style={{
          flex: 1
        }}
      >
        {route.params.sections ? (
          <Animated.FlatList
            entering={FadeInDown}
            exiting={FadeOutDown}
            data={route.params.sections}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
          />
        ) : null}
        {route.params.component ? components[route.params.component] : null}
      </View>
    </DelayLayout>
  );
};

export default Group;
