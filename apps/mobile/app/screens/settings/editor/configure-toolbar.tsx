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

import React from "react";
import { StyleSheet, View } from "react-native";
import { DraxProvider, DraxScrollView } from "react-native-drax";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Button } from "../../../components/ui/button";
import { Notice } from "../../../components/ui/notice";
import Paragraph from "../../../components/ui/typography/paragraph";
import PremiumService from "../../../services/premium";
import { useThemeColors } from "@notesnook/theme";
import { AppFontSize } from "../../../utils/size";
import { Group } from "./group";
import { DragState, useDragState } from "./state";
import { strings } from "@notesnook/intl";
import { DefaultAppStyles } from "../../../utils/styles";
export const ConfigureToolbar = () => {
  const data = useDragState((state) => state.data);
  const preset = useDragState((state) => state.preset);
  const { colors } = useThemeColors();

  const renderGroups = () => {
    return data?.map((item, index) => (
      <Group key={`group-${index}`} item={item} index={index} />
    ));
  };

  return (
    <DraxProvider>
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutDown}
        style={styles.container}
      >
        <View
          style={{
            paddingVertical: DefaultAppStyles.GAP_VERTICAL
          }}
        >
          <Notice text={strings.configureToolbarNotice()} type="information" />

          <Paragraph
            style={{
              marginTop: DefaultAppStyles.GAP_VERTICAL
            }}
            size={AppFontSize.xs}
            color={colors.secondary.paragraph}
          >
            {strings.presets()}
          </Paragraph>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              width: "100%",
              marginTop: DefaultAppStyles.GAP_VERTICAL
            }}
          >
            {[
              {
                id: "default",
                name: strings.default()
              },
              {
                id: "minimal",
                name: strings.minimal()
              },
              {
                id: "custom",
                name: strings.custom(),
                pro: true
              }
            ].map((item) => (
              <Button
                type={preset === item.id ? "accent" : "secondaryAccented"}
                style={{
                  borderRadius: 100,
                  marginRight: 10,
                  paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL
                }}
                proTag={item.pro}
                onPress={() => {
                  if (item.id === "custom" && !PremiumService.get()) {
                    PremiumService.sheet("global");
                    return;
                  }
                  useDragState
                    .getState()
                    .setPreset(item.id as DragState["preset"]);
                }}
                fontSize={AppFontSize.sm - 1}
                key={item.name}
                title={item.name}
              />
            ))}
          </View>
        </View>
        <DraxScrollView
          style={{
            flex: 1
          }}
          scrollEventThrottle={13}
          showsVerticalScrollIndicator={false}
        >
          {renderGroups()}
          <View
            style={{
              height: 500
            }}
          >
            <Button
              title={strings.createAGroup()}
              type="secondaryAccented"
              icon="plus"
              style={{
                width: "100%"
              }}
              onPress={() => {
                const _data = data ? data.slice() : [];
                _data.push([]);
                useDragState.getState().setData(_data);
              }}
            />
          </View>
        </DraxScrollView>
      </Animated.View>
    </DraxProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: DefaultAppStyles.GAP,
    width: "100%"
  }
});
