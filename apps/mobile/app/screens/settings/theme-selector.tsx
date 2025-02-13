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
  THEME_COMPATIBILITY_VERSION,
  ThemeDefinition,
  getPreviewColors,
  useThemeColors,
  validateTheme
} from "@notesnook/theme";
import type {
  CompiledThemeDefinition,
  ThemeMetadata,
  ThemesRouter
} from "@notesnook/themes-server";
import DocumentPicker from "react-native-document-picker";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { MasonryFlashList } from "@shopify/flash-list";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  TouchableOpacity,
  View
} from "react-native";
import { DatabaseLogger, db } from "../../common/database";
import SheetProvider from "../../components/sheet-provider";
import { Button } from "../../components/ui/button";
import Input from "../../components/ui/input";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastManager, presentSheet } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { defaultBorderRadius, AppFontSize } from "../../utils/size";
import { getElevationStyle } from "../../utils/elevation";
import { MenuItemsList } from "../../utils/menu-items";
import { IconButton } from "../../components/ui/icon-button";
import { Pressable } from "../../components/ui/pressable";
import { getColorLinearShade } from "../../utils/colors";
import { strings } from "@notesnook/intl";

const THEME_SERVER_URL = "https://themes-api.notesnook.com";
//@ts-ignore
export const themeTrpcClient = createTRPCProxyClient<ThemesRouter>({
  links: [
    httpBatchLink({
      url: THEME_SERVER_URL
    })
  ]
});

function ThemeSelector() {
  const [darkTheme, lightTheme] = useThemeStore((state) => [
    state.darkTheme,
    state.lightTheme
  ]);

  const { colors } = useThemeColors();
  const themeColors = colors;
  const [searchQuery, setSearchQuery] = useState<string>();
  const [colorScheme, setColorScheme] = useState<string>();
  const themes = trpc.themes.useInfiniteQuery(
    {
      limit: 10,
      compatibilityVersion: THEME_COMPATIBILITY_VERSION,
      filters: [
        ...(searchQuery && searchQuery !== ""
          ? [
              {
                type: "term" as const,
                value: searchQuery
              }
            ]
          : []),
        ...(colorScheme && colorScheme !== ""
          ? [
              {
                type: "colorScheme" as const,
                value: colorScheme
              }
            ]
          : [])
      ]
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );

  const select = (item: Partial<ThemeMetadata>, fromFile?: boolean) => {
    presentSheet({
      context: "theme-details",
      component: (ref, close) => (
        <ThemeSetter close={close} theme={item} fromFile={fromFile} />
      )
    });
  };

  const renderItem = ({
    item,
    index
  }: {
    item: ThemeMetadata;
    index: number;
  }) => {
    const colors =
      item.previewColors ||
      getPreviewColors(item as unknown as ThemeDefinition);

    return (
      <>
        <TouchableOpacity
          activeOpacity={0.9}
          style={{
            borderRadius: 10,
            padding: 6,
            marginBottom: 10,
            flexShrink: 1,
            marginHorizontal: 10
          }}
          onPress={() => select(item)}
        >
          <View
            style={{
              backgroundColor: colors?.background,
              height: 200,
              width: "100%",
              borderRadius: 10,
              marginBottom: 10,
              overflow: "hidden",
              flexDirection: "row",
              justifyContent: "space-between",
              ...getElevationStyle(3)
            }}
          >
            <View
              style={{
                height: "100%",
                width: "49.5%",
                backgroundColor: colors.navigationMenu.background,
                padding: 5,
                paddingVertical: 3,
                borderRadius: defaultBorderRadius
              }}
            >
              {MenuItemsList.map((item, index) => (
                <View
                  key={item.id}
                  style={{
                    height: 12,
                    width: "100%",
                    backgroundColor:
                      index === 0
                        ? colors.navigationMenu.accent + 40
                        : colors.navigationMenu.background,
                    borderRadius: 2,
                    paddingHorizontal: 3,
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4
                  }}
                >
                  <Icon
                    size={8}
                    name={item.icon}
                    color={
                      index === 0
                        ? colors.navigationMenu.accent
                        : colors.navigationMenu.icon
                    }
                  />

                  <View
                    style={{
                      height: 3,
                      width: "40%",
                      backgroundColor:
                        index === 0
                          ? colors.navigationMenu.accent
                          : colors.paragraph,
                      borderRadius: 2,
                      marginLeft: 3
                    }}
                  ></View>
                </View>
              ))}
            </View>

            <View
              style={{
                height: "100%",
                width: "49.5%",
                backgroundColor: colors.list.background,
                borderRadius: defaultBorderRadius,
                paddingHorizontal: 2,
                paddingRight: 6
              }}
            >
              <View
                style={{
                  height: 12,
                  width: "100%",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 3
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center"
                  }}
                >
                  <Icon size={8} color={colors.list.heading} name="menu" />
                  <Heading
                    style={{
                      marginLeft: 3
                    }}
                    color={colors.list.heading}
                    size={7}
                  >
                    {strings.dataTypesPluralCamelCase.note()}
                  </Heading>
                </View>

                <Icon name="magnify" color={colors.list.heading} size={7} />
              </View>
            </View>

            <View
              style={{
                width: "100%",
                alignItems: "flex-end",
                justifyContent: "flex-end",
                marginTop: 6,
                position: "absolute",
                bottom: 6,
                right: 6,
                flexDirection: "row",
                gap: 10
              }}
            >
              {darkTheme.id === item.id || lightTheme.id === item.id ? (
                <IconButton
                  name="check"
                  type="plain"
                  style={{
                    borderRadius: 100,
                    paddingHorizontal: 6,
                    alignSelf: "flex-end",
                    width: 25,
                    height: 25
                  }}
                  color={colors.accent}
                  size={16}
                />
              ) : null}

              <Button
                title={
                  item.colorScheme === "dark" ? strings.dark() : strings.light()
                }
                type="secondaryAccented"
                height={25}
                buttonType={{
                  color: item.colorScheme === "dark" ? "black" : "#f0f0f060",
                  text: colors.accent
                }}
                style={{
                  borderRadius: 100,
                  paddingHorizontal: 12,
                  alignSelf: "flex-end",
                  borderColor:
                    item.colorScheme === "dark"
                      ? getColorLinearShade("#000000", 0.1, true)
                      : getColorLinearShade("#f0f0f0", 0.1, true)
                }}
                fontSize={AppFontSize.xxs}
              />
            </View>
          </View>

          <Heading size={AppFontSize.sm} color={themeColors.primary.heading}>
            {item.name}
          </Heading>
          <Paragraph
            size={AppFontSize.xs}
            color={themeColors.secondary?.paragraph}
          >
            {strings.by()} {item.authors?.[0].name}
          </Paragraph>
        </TouchableOpacity>
      </>
    );
  };
  let resetTimer: NodeJS.Timeout;
  const onSearch = (text: string) => {
    clearTimeout(resetTimer as NodeJS.Timeout);
    resetTimer = setTimeout(() => {
      setSearchQuery(text);
    }, 400);
  };

  function getThemes(): ThemeMetadata[] {
    const pages = themes.data?.pages;

    return (
      pages
        ?.map((page) => {
          return page.themes;
        })
        .flat()
        .filter((theme) =>
          searchQuery && searchQuery !== ""
            ? true
            : darkTheme.id !== theme.id && lightTheme.id !== theme.id
        ) || []
    );
  }
  return (
    <>
      <SheetProvider context="theme-details" />
      <View
        style={{
          flex: 1
        }}
      >
        <View
          style={{
            paddingHorizontal: 12,
            marginBottom: 12,
            paddingTop: 12
          }}
        >
          <Input onChangeText={onSearch} placeholder={strings.searchThemes()} />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between"
            }}
          >
            <View
              style={{
                flexDirection: "row",
                columnGap: 10
              }}
            >
              <Button
                height={30}
                style={{ borderRadius: 100, minWidth: 60 }}
                type={
                  colorScheme === "" || !colorScheme ? "accent" : "secondary"
                }
                title={strings.all()}
                fontSize={AppFontSize.xs}
                onPress={() => {
                  setColorScheme("");
                }}
              />
              <Button
                style={{ borderRadius: 100, minWidth: 60 }}
                height={30}
                type={colorScheme === "dark" ? "accent" : "secondary"}
                title={strings.dark()}
                fontSize={AppFontSize.xs}
                onPress={() => {
                  setColorScheme("dark");
                }}
              />
              <Button
                style={{ borderRadius: 100, minWidth: 60 }}
                height={30}
                fontSize={AppFontSize.xs}
                type={colorScheme === "light" ? "accent" : "secondary"}
                title={strings.light()}
                onPress={() => {
                  setColorScheme("light");
                }}
              />
            </View>

            <Button
              title={strings.loadFromFile()}
              style={{ borderRadius: 100, minWidth: 60 }}
              height={30}
              type={"secondaryAccented"}
              icon="folder"
              fontSize={AppFontSize.xs}
              onPress={() => {
                DocumentPicker.pickSingle({
                  allowMultiSelection: false
                }).then((r) => {
                  fetch(r.uri).then(async (response) => {
                    const json = await response.json();
                    const result = validateTheme(json);
                    if (result.error) {
                      ToastManager.error(new Error(result.error));
                      return;
                    }
                    select(json, true);
                  });
                });
              }}
            />
          </View>
        </View>

        <MasonryFlashList
          numColumns={2}
          data={[
            ...(colorScheme === "dark" || (searchQuery && searchQuery !== "")
              ? []
              : [lightTheme as unknown as ThemeMetadata]),
            ...(colorScheme === "light" || (searchQuery && searchQuery !== "")
              ? []
              : [darkTheme as unknown as ThemeMetadata]),
            ...getThemes()
          ]}
          ListEmptyComponent={
            <View
              style={{
                height: 100,
                width: "100%",
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {themes.isLoading ? (
                <ActivityIndicator color={colors.primary.accent} />
              ) : searchQuery ? (
                <Paragraph color={colors.secondary.paragraph}>
                  {strings.noResultsForSearch(searchQuery)}
                </Paragraph>
              ) : (
                <Paragraph>{strings.noThemesFound()}.</Paragraph>
              )}
            </View>
          }
          ListFooterComponent={
            themes.isError ? (
              <View
                style={{
                  height: 100,
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <Paragraph color={colors.error.paragraph}>
                  {strings.errorLoadingThemes()}. {themes.error.message}.
                </Paragraph>
              </View>
            ) : null
          }
          estimatedItemSize={200}
          renderItem={renderItem}
          onEndReachedThreshold={0.1}
          onEndReached={() => {
            themes.fetchNextPage();
          }}
        />
      </View>
    </>
  );
}

const trpc = createTRPCReact<ThemesRouter>();
export default function ThemeSelectorWithQueryClient() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    //@ts-ignore
    trpc.createClient({
      links: [
        //@ts-ignore
        httpBatchLink({
          url: THEME_SERVER_URL
        })
      ]
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <ThemeSelector />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const ThemeSetter = ({
  theme,
  close,
  fromFile
}: {
  theme: Partial<CompiledThemeDefinition>;
  close?: (ctx?: string) => void;
  fromFile?: boolean;
}) => {
  const [darkTheme, lightTheme] = useThemeStore((state) => [
    state.darkTheme,
    state.lightTheme
  ]);
  const themeColors = useThemeColors();

  const colors =
    theme?.previewColors ||
    getPreviewColors(theme as unknown as ThemeDefinition);

  const applyTheme = async () => {
    if (!theme.id) return;
    try {
      const user = await db.user?.getUser();
      const fullTheme = fromFile
        ? (theme as ThemeDefinition)
        : await themeTrpcClient.installTheme.query({
            compatibilityVersion: THEME_COMPATIBILITY_VERSION,
            id: theme.id,
            userId: user?.id
          });
      if (!fullTheme) return;
      theme.colorScheme === "dark"
        ? useThemeStore.getState().setDarkTheme(fullTheme)
        : useThemeStore.getState().setLightTheme(fullTheme);
      ToastManager.show({
        heading: `${theme.name} applied successfully`,
        type: "success",
        context: "global"
      });
    } catch (e) {
      DatabaseLogger.error(e);
    }

    setTimeout(() => {
      close?.();
    });
  };

  return (
    <>
      <View
        style={{
          paddingHorizontal: 12
        }}
      >
        <View
          style={{
            borderRadius: 10,
            marginBottom: 12,
            padding: 12
          }}
        >
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors?.accent + "20",
              padding: 12,
              borderRadius: 15,
              marginBottom: 12
            }}
          >
            <View
              style={{
                backgroundColor: colors?.background,
                borderWidth: 0.5,
                borderColor: colors?.border,
                height: 200,
                width: "100%",
                borderRadius: 10,
                marginBottom: 10,
                overflow: "hidden",
                flexDirection: "row",
                justifyContent: "space-between",
                ...getElevationStyle(3),
                maxWidth: 200
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: "49.5%",
                  backgroundColor: colors?.navigationMenu.background,
                  padding: 5,
                  paddingVertical: 3,
                  borderRadius: defaultBorderRadius
                }}
              >
                {MenuItemsList.map((item, index) => (
                  <View
                    key={item.id}
                    style={{
                      height: 12,
                      width: "100%",
                      backgroundColor:
                        index === 0
                          ? //@ts-ignore
                            colors?.navigationMenu?.accent + 40
                          : colors?.navigationMenu.background,
                      borderRadius: 2,
                      paddingHorizontal: 3,
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 4
                    }}
                  >
                    <Icon
                      size={8}
                      name={item.icon}
                      color={
                        index === 0
                          ? colors?.navigationMenu.accent
                          : colors?.navigationMenu.icon
                      }
                    />

                    <View
                      style={{
                        height: 3,
                        width: "40%",
                        backgroundColor:
                          index === 0
                            ? colors?.navigationMenu.accent
                            : colors?.paragraph,
                        borderRadius: 2,
                        marginLeft: 3
                      }}
                    ></View>
                  </View>
                ))}
              </View>

              <View
                style={{
                  height: "100%",
                  width: "49.5%",
                  backgroundColor: colors?.list.background,
                  borderRadius: defaultBorderRadius,
                  paddingHorizontal: 2,
                  paddingRight: 6
                }}
              >
                <View
                  style={{
                    height: 12,
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 3
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center"
                    }}
                  >
                    <Icon size={8} color={colors?.list.heading} name="menu" />
                    <Heading
                      style={{
                        marginLeft: 3
                      }}
                      color={colors?.list.heading}
                      size={7}
                    >
                      {strings.dataTypesPluralCamelCase.note()}
                    </Heading>
                  </View>

                  <Icon name="magnify" color={colors?.list.heading} size={7} />
                </View>
              </View>
            </View>
          </View>

          <Heading
            size={AppFontSize.md}
            color={themeColors.colors.primary.heading}
          >
            {theme.name}
          </Heading>
          <Paragraph color={themeColors.colors.primary.paragraph}>
            {theme.description}
          </Paragraph>

          <Paragraph
            size={AppFontSize.xs}
            color={themeColors.colors.secondary.paragraph}
          >
            {strings.by()} {theme.authors?.[0]?.name}
          </Paragraph>
          <View
            style={{
              marginTop: 5,
              flexDirection: "column",
              rowGap: 3
            }}
          >
            <Paragraph
              size={AppFontSize.xs}
              color={themeColors.colors.secondary.paragraph}
            >
              ${strings.version()} {theme.version}
            </Paragraph>

            <Paragraph
              size={AppFontSize.xs}
              color={themeColors.colors.secondary.paragraph}
            >
              {theme.license}
            </Paragraph>

            {theme.homepage ? (
              <View
                style={{
                  flexDirection: "row"
                }}
              >
                <Paragraph
                  size={AppFontSize.xs}
                  color={themeColors.colors.secondary.accent}
                  onPress={() => {
                    Linking.openURL(theme.homepage as string);
                  }}
                >
                  {strings.visitHomePage()}
                </Paragraph>
              </View>
            ) : null}
          </View>
        </View>

        {darkTheme.id === theme.id || lightTheme.id === theme.id ? (
          <Pressable
            onPress={applyTheme}
            type="secondaryAccented"
            style={{
              paddingVertical: 12
            }}
          >
            <Heading color={colors.accentForeground} size={AppFontSize.md}>
              {darkTheme.id === theme.id
                ? strings.appliedDark()
                : strings.appliedLight()}
            </Heading>
            <Paragraph size={AppFontSize.xs}>
              ({strings.tapToApplyAgain()})
            </Paragraph>
          </Pressable>
        ) : (
          <Button
            style={{
              width: "100%",
              marginBottom: 10
            }}
            onPress={applyTheme}
            title={
              theme.colorScheme === "dark"
                ? strings.setAsDarkTheme()
                : strings.setAsLightTheme()
            }
            type="secondaryAccented"
          />
        )}
      </View>
    </>
  );
};
