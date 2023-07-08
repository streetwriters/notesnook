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
import {
  ScopedThemeProvider,
  ThemeDark,
  ThemeDefinition,
  ThemeDracula,
  ThemeLight,
  ThemeProvider
} from "@notesnook/theme";
import React from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { SIZE } from "../../utils/size";
import { presentSheet } from "../../services/event-manager";
import { Button } from "../../components/ui/button";
import SheetProvider from "../../components/sheet-provider";
import { useThemeStore } from "../../stores/use-theme-store";

const ThemeSetter = ({
  theme,
  close
}: {
  theme: ThemeDefinition;
  close?: (ctx?: string) => void;
}) => {
  const colors = theme.scopes.base;
  return (
    <>
      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <View
          style={{
            backgroundColor: colors.primary.background,
            borderRadius: 10,
            marginBottom: 12
          }}
        >
          <View
            style={{
              backgroundColor: colors.primary.accent,
              height: 70,
              width: "100%",
              borderRadius: 10
            }}
          />
          <View
            style={{
              flexDirection: "row",
              marginTop: 6,
              marginBottom: 10
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.primary.shade,
                height: 50,
                borderRadius: 10,
                marginRight: 6
              }}
            />

            <View
              style={{
                flex: 1,
                backgroundColor: colors.secondary.background,
                height: 50,
                borderRadius: 10
              }}
            />
          </View>

          <Heading size={SIZE.md} color={colors.primary.heading}>
            {theme.name}
          </Heading>
          <Paragraph color={colors.primary.paragraph}>
            {theme.description}
          </Paragraph>

          <Paragraph size={SIZE.xs} color={colors.secondary.paragraph}>
            By {theme.author}
          </Paragraph>
        </View>

        <Button
          style={{
            width: "100%",
            marginBottom: 10
          }}
          onPress={() => {
            theme.colorScheme === "dark"
              ? useThemeStore.getState().setDarkTheme(theme)
              : useThemeStore.getState().setLightTheme(theme);
            setTimeout(() => {
              close?.();
            });
          }}
          title={
            theme.colorScheme === "dark"
              ? "Set as dark theme"
              : "Set as light theme"
          }
          type="grayBg"
        />
      </View>
    </>
  );
};

const themes = [ThemeLight, ThemeDark, ThemeDracula];

export default function ThemeSelector() {
  const select = (item: ThemeDefinition) => {
    presentSheet({
      context: item.id,
      component: (ref, close) => <ThemeSetter close={close} theme={item} />
    });
  };

  const renderItem = ({
    item,
    index
  }: {
    item: ThemeDefinition;
    index: number;
  }) => {
    const colors = item.scopes.base;

    return (
      <>
        <ThemeProvider
          value={{
            theme: item,
            setTheme: () => null
          }}
        >
          <ScopedThemeProvider value="sheet">
            <SheetProvider context={item.id} />
          </ScopedThemeProvider>
        </ThemeProvider>
        <TouchableOpacity
          activeOpacity={0.9}
          style={{
            backgroundColor: colors.primary.background,
            borderRadius: 10,
            padding: 12,
            marginBottom: 10,
            flexShrink: 1,
            marginHorizontal: 5,
            borderWidth: 1,
            borderColor: colors.primary.border,
            flex: 0.5
          }}
          onPress={() => select(item)}
        >
          <View
            style={{
              backgroundColor: colors.primary.accent,
              height: 40,
              width: "100%",
              borderRadius: 10
            }}
          />
          <View
            style={{
              flexDirection: "row",
              marginTop: 6
            }}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: colors.primary.shade,
                height: 40,
                borderRadius: 10,
                marginRight: 6
              }}
            />

            <View
              style={{
                flex: 1,
                backgroundColor: colors.secondary.background,
                height: 40,
                borderRadius: 10
              }}
            />
          </View>
          <Heading size={SIZE.md} color={colors.primary.heading}>
            {item.name}
          </Heading>
          <Paragraph color={colors.primary.paragraph}>
            {item.description}
          </Paragraph>

          <Paragraph size={SIZE.xs} color={colors.secondary.paragraph}>
            By {item.author}
          </Paragraph>
        </TouchableOpacity>
      </>
    );
  };
  return (
    <View
      style={{
        flex: 1,
        padding: 12
      }}
    >
      <FlatList numColumns={2} data={themes} renderItem={renderItem} />
    </View>
  );
}
