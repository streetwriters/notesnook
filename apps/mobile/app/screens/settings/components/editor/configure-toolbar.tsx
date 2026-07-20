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

import { isFeatureAvailable } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { StyleSheet, View } from "react-native";
import { DraxProvider, DraxScrollView } from "react-native-drax";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { Spacing } from "../../../../common/design/spacing";
import PaywallSheet from "../../../../components/sheets/paywall";
import AppIcon from "../../../../components/ui/AppIcon";
import { Button } from "../../../../components/ui/button";
import { Notice } from "../../../../components/ui/notice";
import { Pressable } from "../../../../components/ui/pressable";
import Heading from "../../../../components/ui/typography/heading";
import Paragraph from "../../../../components/ui/typography/paragraph";
import { ToastManager } from "../../../../services/event-manager";
import { DefaultAppStyles } from "../../../../utils/styles";
import { Group } from "./group";
import { DragState, useDragState } from "./state";

const PRESETS = [
  { id: "default", name: strings.default() },
  { id: "minimal", name: strings.minimal() },
  { id: "custom", name: strings.custom(), pro: true }
];

export const ConfigureToolbar = () => {
  const data = useDragState((state) => state.data);
  const preset = useDragState((state) => state.preset);
  const { colors } = useThemeColors();

  const addGroup = () => {
    const _data = data ? data.slice() : [];
    _data.push([]);
    useDragState.getState().setData(_data);
  };

  const renderGroups = () => {
    return data?.map((item, index) => (
      <Group key={`group-${index}-${item.length}`} item={item} index={index} />
    ));
  };

  const isEmpty = !data || data.length === 0;

  return (
    <DraxProvider>
      <Animated.View
        entering={FadeInDown}
        exiting={FadeOutDown}
        style={styles.container}
      >
        <View
          style={{
            paddingVertical: DefaultAppStyles.GAP_VERTICAL,
            gap: DefaultAppStyles.GAP
          }}
        >
          <Notice
            text={strings.configureToolbarNotice()}
            type="information"
            size="small"
          />

          <View style={{ gap: DefaultAppStyles.GAP_VERTICAL }}>
            <Heading
              fontSize="SM"
              fontFamily="MEDIUM"
              color={colors.primary.accent}
            >
              {strings.presets()}
            </Heading>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                width: "100%",
                gap: Spacing.LEVEL_2
              }}
            >
              {PRESETS.map((item) => {
                const selected = preset === item.id;
                return (
                  <Pressable
                    key={item.id}
                    type="transparent"
                    onPress={async () => {
                      if (item.id === "custom") {
                        const customToolbarPresetFeature =
                          await isFeatureAvailable("customToolbarPreset");
                        if (!customToolbarPresetFeature.isAllowed) {
                          ToastManager.show({
                            message: customToolbarPresetFeature.error,
                            type: "info",
                            actionText: strings.upgrade(),
                            func: () =>
                              PaywallSheet.present(customToolbarPresetFeature)
                          });
                          return;
                        }
                      }
                      useDragState
                        .getState()
                        .setPreset(item.id as DragState["preset"]);
                    }}
                    style={{
                      paddingHorizontal: Spacing.LEVEL_2,
                      paddingVertical: Spacing.LEVEL_0,
                      borderRadius: 50,
                      backgroundColor: selected
                        ? colors.selected.background
                        : "transparent",
                      borderWidth: selected ? 0 : 1,
                      borderColor: colors.primary.border,
                      width: "auto"
                    }}
                  >
                    <Heading
                      fontSize="SM"
                      fontFamily={selected ? "MEDIUM" : "REGULAR"}
                      lineHeight={null}
                      color={
                        selected
                          ? colors.primary.heading
                          : colors.secondary.paragraph
                      }
                    >
                      {item.name}
                    </Heading>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        <DraxScrollView
          style={{
            flex: 1
          }}
          key={preset}
          scrollEventThrottle={13}
          showsVerticalScrollIndicator={false}
        >
          {isEmpty ? (
            <View
              style={{
                gap: Spacing.LEVEL_4,
                alignItems: "center",
                paddingTop: Spacing.LEVEL_8
              }}
            >
              <View style={{ gap: Spacing.LEVEL_1 }}>
                <Heading
                  fontSize="XL"
                  lineHeight="100%"
                  style={{ textAlign: "center" }}
                >
                  {strings.noGroupsCreated()}
                </Heading>
                <Paragraph
                  fontSize="SM"
                  color={colors.primary.paragraph}
                  style={{ textAlign: "center" }}
                >
                  {strings.noGroupsCreatedDesc()}
                </Paragraph>
              </View>
              <Button
                title={strings.createAGroup()}
                type="accent"
                style={{ width: "auto" }}
                onPress={addGroup}
              />
            </View>
          ) : (
            <>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <Heading
                  fontSize="SM"
                  fontFamily="MEDIUM"
                  color={colors.primary.accent}
                >
                  {strings.toolbarGroups()}
                </Heading>
                <Pressable
                  type="transparent"
                  onPress={addGroup}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: DefaultAppStyles.GAP_VERTICAL_SMALL,
                    paddingVertical: DefaultAppStyles.GAP_VERTICAL_SMALL,
                    width: "auto"
                  }}
                >
                  <AppIcon
                    name="plus"
                    iconFamily="notesnook"
                    size={16}
                    color={colors.primary.accent}
                  />
                  <Heading
                    fontSize="SM"
                    fontFamily="MEDIUM"
                    lineHeight={null}
                    color={colors.primary.accent}
                  >
                    {strings.newGroup()}
                  </Heading>
                </Pressable>
              </View>
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.primary.border
                }}
              />
              {renderGroups()}
              <View style={{ height: 300 }} />
            </>
          )}
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
