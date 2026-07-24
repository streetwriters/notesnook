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
import { LegendList } from "@legendapp/list";
import { strings } from "@notesnook/intl";
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
import Clipboard from "@react-native-clipboard/clipboard";
import { keepLocalCopy, pick } from "@react-native-documents/picker";
import {
  QueryClient,
  QueryClientProvider,
  notifyManager
} from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  View,
  useWindowDimensions
} from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";
import { DatabaseLogger, db } from "../../../common/database";
import { Radius, Spacing } from "../../../common/design/spacing";
import { santizeUri } from "../../../common/filesystem/utils";
import SheetProvider from "../../../components/sheet-provider";
import AppIcon from "../../../components/ui/AppIcon";
import { Button } from "../../../components/ui/button";
import Input from "../../../components/ui/input";
import { Pressable } from "../../../components/ui/pressable";
import Heading from "../../../components/ui/typography/heading";
import Paragraph from "../../../components/ui/typography/paragraph";
import { ToastManager, presentSheet } from "../../../services/event-manager";
import { useThemeStore } from "../../../stores/use-theme-store";
import { getElevationStyle } from "../../../utils/elevation";
import { openLinkInBrowser } from "../../../utils/functions";
import { AppFontSize } from "../../../utils/size";

const THEME_SERVER_URL = "https://themes-api.notesnook.com";
//@ts-ignore
export const themeTrpcClient = createTRPCProxyClient<ThemesRouter>({
  links: [
    httpBatchLink({
      url: THEME_SERVER_URL
    })
  ]
});

const THEME_CARD_HEIGHT = 193;
const THEME_CARD_PREVIEW_HEIGHT = 154;
const THEME_CARD_CHECK_SIZE = 24;
const THEME_CARD_PREVIEW_PADDING = 19;
const THEME_CARD_ROW_OFFSET = 10;

function ThemeCard({
  item,
  width,
  selected,
  onPress,
  colors
}: {
  item: ThemeMetadata;
  width: number;
  selected: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>["colors"];
}) {
  const previewColors =
    item.previewColors || getPreviewColors(item as unknown as ThemeDefinition);

  const previewWidth = width - THEME_CARD_PREVIEW_PADDING * 2;
  const menuWidth = previewWidth * 0.336;
  const noteWidth = previewWidth - menuWidth;
  const previewSurfaceColor = selected
    ? colors.selected.background
    : colors.primary.background;

  return (
    <Pressable
      onPress={onPress}
      type="transparent"
      style={{
        width: width,
        gap: Spacing.LEVEL_2,
        alignItems: "flex-start",
        paddingTop: selected ? THEME_CARD_ROW_OFFSET : 0,
        backgroundColor: "transparent",
        paddingHorizontal: 0,
        paddingVertical: 0,
        borderWidth: 0,
        marginTop: Spacing.LEVEL_3
      }}
    >
      <View
        style={{
          width,
          height: THEME_CARD_HEIGHT,
          borderRadius: Radius.MD,
          borderWidth: 1,
          borderColor: selected
            ? colors.primary.accent
            : colors.primary.separator,
          backgroundColor: previewSurfaceColor,
          paddingTop: selected ? THEME_CARD_ROW_OFFSET : 0,
          overflow: "visible",
          ...getElevationStyle(3)
        }}
      >
        <View
          style={{
            marginHorizontal: THEME_CARD_PREVIEW_PADDING,
            marginTop: selected
              ? THEME_CARD_PREVIEW_PADDING - THEME_CARD_ROW_OFFSET
              : THEME_CARD_PREVIEW_PADDING,
            height: THEME_CARD_PREVIEW_HEIGHT,
            borderRadius: 10,
            overflow: "hidden",
            flexDirection: "row"
          }}
        >
          <View
            style={{
              height: "100%",
              width: menuWidth,
              backgroundColor: previewColors.navigationMenu.background,
              borderTopLeftRadius: 10,
              borderBottomLeftRadius: 10,
              paddingTop: 11
            }}
          >
            {[
              {
                width: 15,
                height: 4
              },
              {
                width: 19,
                height: 4
              },
              {
                width: 19,
                height: 4
              },
              {
                width: 15,
                height: 4
              }
            ].map((menuItem, index) => (
              <View
                key={"menu-placeholder-" + menuItem.width}
                style={{
                  height: 6,
                  width: "100%",
                  borderRadius: Radius.XXS,
                  paddingHorizontal: 3,
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 2.3
                }}
              >
                <View
                  style={{
                    height: 4,
                    width: menuItem.width,
                    backgroundColor:
                      index === 0
                        ? previewColors.navigationMenu.accent
                        : previewColors.border,
                    borderRadius: Radius.XXS,
                    marginLeft: 3
                  }}
                />
              </View>
            ))}
          </View>

          <View
            style={{
              height: "100%",
              width: noteWidth,
              backgroundColor: previewColors.list.background,
              borderTopRightRadius: 10,
              borderBottomRightRadius: 10,
              paddingTop: 11,
              paddingHorizontal: 4,
              paddingRight: 6
            }}
          >
            <View
              style={{
                height: 12,
                width: "100%",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <View
                style={{
                  height: 4,
                  width: 15,
                  backgroundColor: previewColors.paragraph,
                  opacity: 0.8,
                  borderRadius: 100
                }}
              />

              <View
                style={{
                  height: 5,
                  width: 5,
                  backgroundColor: previewColors.paragraph,
                  opacity: 0.8,
                  borderRadius: 100
                }}
              />
            </View>

            <View
              style={{
                marginTop: Spacing.LEVEL_0,
                gap: Spacing.LEVEL_0 - 1
              }}
            >
              <View
                style={{
                  width: "72%",
                  height: 4,
                  borderRadius: Radius.XXS,
                  backgroundColor: previewColors.paragraph,
                  opacity: 0.4
                }}
              />
              <View
                style={{
                  width: "72%",
                  height: 4,
                  borderRadius: Radius.XXS,
                  backgroundColor: previewColors.paragraph,
                  opacity: 0.4
                }}
              />
              <View
                style={{
                  width: "58%",
                  height: 4,
                  borderRadius: Radius.XXS,
                  backgroundColor: previewColors.paragraph,
                  opacity: 0.4
                }}
              />
            </View>
          </View>

          <View
            style={{
              position: "absolute",
              right: 4,
              bottom: 4,
              borderRadius: 10,
              paddingHorizontal: Spacing.LEVEL_0,
              paddingVertical: Spacing.LEVEL_0,
              backgroundColor:
                item.colorScheme === "dark"
                  ? previewColors.list.background
                  : previewColors.navigationMenu.background
            }}
          >
            <Paragraph
              size={AppFontSize.xxs}
              color={
                item.colorScheme === "dark"
                  ? previewColors.navigationMenu.accent
                  : previewColors.paragraph
              }
            >
              {item.colorScheme === "dark"
                ? strings.dark().toUpperCase()
                : strings.light().toUpperCase()}
            </Paragraph>
          </View>
        </View>

        {selected ? (
          <View
            style={{
              position: "absolute",
              top: -THEME_CARD_ROW_OFFSET,
              right: Spacing.LEVEL_0,
              width: THEME_CARD_CHECK_SIZE,
              height: THEME_CARD_CHECK_SIZE,
              borderRadius: THEME_CARD_CHECK_SIZE / 2,
              backgroundColor: colors.primary.accent,
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <AppIcon
              name="check"
              size={16}
              color={colors.primary.accentForeground}
            />
          </View>
        ) : null}
      </View>

      <View style={{ gap: Spacing.LEVEL_0 + 2 }}>
        <Heading fontSize="SM" lineHeight="100%" color={colors.primary.heading}>
          {item.name}
        </Heading>
        <Paragraph
          fontSize="XS"
          lineHeight="120%"
          color={colors.primary.paragraph}
        >
          {strings.by()} {item.authors?.[0].name}
        </Paragraph>
      </View>
    </Pressable>
  );
}
notifyManager.setBatchNotifyFunction((cb) => cb());
notifyManager.setNotifyFunction((cb) => cb());
function ThemeSelector() {
  const [darkTheme, lightTheme] = useThemeStore((state) => [
    state.darkTheme,
    state.lightTheme
  ]);

  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useThemeColors();
  const [searchQuery, setSearchQuery] = useState<string>();
  const [colorScheme, setColorScheme] = useState<"all" | "dark" | "light">(
    "all"
  );

  const filters = [];
  if (searchQuery) filters.push({ type: "term" as const, value: searchQuery });
  if (colorScheme !== "all")
    filters.push({ type: "colorScheme" as const, value: colorScheme });
  const resetTimer = useRef<NodeJS.Timeout>(undefined);

  const themes = trpc.themes.useInfiniteQuery(
    {
      limit: 10,
      compatibilityVersion: THEME_COMPATIBILITY_VERSION,
      filters
    },
    {
      keepPreviousData: true,
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );

  if (themes?.isError) {
    DatabaseLogger.error(
      new Error(themes.error.message),
      "themes loading error",
      themes.error?.data || undefined
    );
  }

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
    const cardWidth =
      (screenWidth - (Spacing.LEVEL_3 * 2 + Spacing.LEVEL_2)) / 2;
    const isSelected = darkTheme.id === item.id || lightTheme.id === item.id;

    return (
      <ThemeCard
        item={item}
        width={cardWidth}
        selected={isSelected}
        onPress={() => select(item)}
        colors={colors}
      />
    );
  };

  const onSearch = (text: string) => {
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => {
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
            ? colorScheme === "all" || colorScheme === theme.colorScheme
            : darkTheme.id !== theme.id &&
              lightTheme.id !== theme.id &&
              (colorScheme === "all" || colorScheme === theme.colorScheme)
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
            paddingHorizontal: Spacing.LEVEL_3,
            marginBottom: Spacing.LEVEL_2,
            paddingTop: Spacing.LEVEL_0,
            gap: Spacing.LEVEL_2
          }}
        >
          <Input
            onChangeText={onSearch}
            placeholder={strings.searchThemes()}
            containerStyle={{
              paddingLeft: Spacing.LEVEL_2,
              paddingRight: Spacing.LEVEL_2,
              backgroundColor: colors.secondary.background,
              borderWidth: 0
            }}
            button={{
              icon: "search",
              size: 16,
              iconFamily: "notesnook",
              color: colors.primary.icon,
              onPress: () => {}
            }}
          />

          <View
            style={{
              marginVertical: Spacing.LEVEL_0,
              borderBottomWidth: 1,
              borderColor: colors.primary.separator
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: Spacing.LEVEL_2
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: Spacing.LEVEL_1
              }}
            >
              <Button
                style={{
                  borderRadius: Radius.XXL,
                  paddingHorizontal: 14,
                  paddingVertical: 10
                }}
                type={
                  colorScheme === "all" || !colorScheme
                    ? "selected"
                    : "plain-outline"
                }
                textStyle={{
                  color:
                    colorScheme === "all"
                      ? colors.primary.heading
                      : colors.secondary.paragraph
                }}
                title={strings.all()}
                fontSize={AppFontSize.sm}
                onPress={() => {
                  setColorScheme("all");
                }}
              />
              <Button
                style={{
                  borderRadius: Radius.XXL,
                  paddingHorizontal: 14,
                  paddingVertical: 10
                }}
                type={colorScheme === "dark" ? "selected" : "plain-outline"}
                textStyle={{
                  color:
                    colorScheme === "dark"
                      ? colors.primary.heading
                      : colors.secondary.paragraph
                }}
                title={strings.dark()}
                fontSize={AppFontSize.sm}
                onPress={() => {
                  setColorScheme("dark");
                }}
              />
              <Button
                style={{
                  borderRadius: Radius.XXL,
                  paddingHorizontal: 14,
                  paddingVertical: 10
                }}
                fontSize={AppFontSize.sm}
                type={colorScheme === "light" ? "selected" : "plain-outline"}
                textStyle={{
                  color:
                    colorScheme === "light"
                      ? colors.primary.heading
                      : colors.secondary.paragraph
                }}
                title={strings.light()}
                onPress={() => {
                  setColorScheme("light");
                }}
              />
            </View>

            <Button
              title={strings.loadFromFile()}
              style={{
                borderRadius: Radius.XS,
                paddingHorizontal: Spacing.LEVEL_2,
                paddingVertical: Spacing.LEVEL_2,
                minWidth: 123
              }}
              type={"accent-outline"}
              fontSize={AppFontSize.sm}
              onPress={async () => {
                try {
                  const pickResponse = await pick({
                    allowMultiSelection: false
                  });
                  const copiedFile = await keepLocalCopy({
                    destination: "cachesDirectory",
                    files: [
                      {
                        uri: pickResponse[0].uri,
                        fileName: pickResponse[0].name || "theme.json"
                      }
                    ]
                  });
                  if (copiedFile[0].status !== "success") return;

                  const themeJsonCopiedPath = santizeUri(
                    copiedFile[0].localUri
                  );

                  const themeJson = await ReactNativeBlobUtil.fs.readFile(
                    themeJsonCopiedPath,
                    "utf8"
                  );
                  ReactNativeBlobUtil.fs
                    .unlink(themeJsonCopiedPath)
                    .catch(() => {});
                  let json;
                  try {
                    json = JSON.parse(themeJson);
                  } catch (e) {
                    ToastManager.show({
                      heading: strings.invalidThemeFileFormat(),
                      type: "error",
                      context: "global",
                      actionText: strings.learnMore(),
                      func: () => {
                        openLinkInBrowser(
                          "https://help.notesnook.com/custom-themes/introduction"
                        );
                      }
                    });
                    return;
                  }
                  const result = validateTheme(json);

                  if (result.error) {
                    if (
                      typeof result.error === "string" &&
                      result.error.includes("missing from the theme")
                    ) {
                      ToastManager.show({
                        heading: strings.themeMissingRequiredFields(),
                        type: "error",
                        context: "global",
                        actionText: strings.copyLogs(),
                        func: () => {
                          Clipboard.setString(result.error || "");
                          ToastManager.show({
                            heading: strings.logsCopied(),
                            type: "success",
                            context: "global"
                          });
                        }
                      });
                    } else {
                      ToastManager.error(new Error(result.error));
                    }

                    return;
                  }
                  select(json, true);
                } catch (e) {
                  if ((e as Error).message.includes("Code=3072")) {
                    return;
                  }
                  ToastManager.error(e as Error);
                }
              }}
            />
          </View>
        </View>

        <LegendList
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: Spacing.LEVEL_2,
            paddingBottom: Spacing.LEVEL_4,
            marginTop: -Spacing.LEVEL_0
          }}
          data={
            themes.isLoading || themes.isError
              ? []
              : [
                  ...(colorScheme === "dark" ||
                  (searchQuery && searchQuery !== "")
                    ? []
                    : [lightTheme as unknown as ThemeMetadata]),
                  ...(colorScheme === "light" ||
                  (searchQuery && searchQuery !== "")
                    ? []
                    : [darkTheme as unknown as ThemeMetadata]),
                  ...getThemes()
                ]
          }
          ListEmptyComponent={
            <View
              style={{
                height: 100,
                width: screenWidth - Spacing.LEVEL_3 * 2,
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
            <View
              style={{
                height: 100,
                width: screenWidth - Spacing.LEVEL_3 * 2,
                justifyContent: "center",
                alignItems: "center"
              }}
            >
              {themes.isError ? (
                <Paragraph color={colors.error.paragraph}>
                  {strings.errorLoadingThemes()}. {themes.error.message}.
                </Paragraph>
              ) : (themes.isLoading || themes.isFetching) &&
                getThemes().length ? (
                <ActivityIndicator color={colors.primary.accent} />
              ) : null}
            </View>
          }
          estimatedItemSize={260}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
          paddingHorizontal: Spacing.LEVEL_3,
          paddingTop: Spacing.LEVEL_2,
          gap: Spacing.LEVEL_3
        }}
      >
        <View
          style={{
            borderRadius: 10
          }}
        >
          <View
            style={{
              width: "100%",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: colors?.accent + "20",
              padding: Spacing.LEVEL_3,
              borderRadius: 15
            }}
          >
            <View
              style={{
                height: THEME_CARD_PREVIEW_HEIGHT,
                borderRadius: 10,
                flexDirection: "row",
                overflow: "visible",
                ...getElevationStyle(3)
              }}
            >
              <View
                style={{
                  height: "100%",
                  width: 70,
                  backgroundColor: colors.navigationMenu.background,
                  borderTopLeftRadius: 10,
                  borderBottomLeftRadius: 10,
                  paddingTop: 11
                }}
              >
                {[
                  {
                    width: 15,
                    height: 4
                  },
                  {
                    width: 19,
                    height: 4
                  },
                  {
                    width: 19,
                    height: 4
                  },
                  {
                    width: 15,
                    height: 4
                  }
                ].map((menuItem, index) => (
                  <View
                    key={"menu-placeholder-" + menuItem.width}
                    style={{
                      height: 6,
                      width: "100%",
                      borderRadius: Radius.XXS,
                      paddingHorizontal: 3,
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 2.3
                    }}
                  >
                    <View
                      style={{
                        height: 4,
                        width: menuItem.width,
                        backgroundColor:
                          index === 0
                            ? colors.navigationMenu.accent
                            : colors.border,
                        borderRadius: Radius.XXS,
                        marginLeft: 3
                      }}
                    />
                  </View>
                ))}
              </View>

              <View
                style={{
                  height: "100%",
                  width: 140,
                  backgroundColor: colors.list.background,
                  borderTopRightRadius: 10,
                  borderBottomRightRadius: 10,
                  paddingTop: 11,
                  paddingHorizontal: 4,
                  paddingRight: 6
                }}
              >
                <View
                  style={{
                    height: 12,
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <View
                    style={{
                      height: 4,
                      width: 15,
                      backgroundColor: colors.paragraph,
                      opacity: 0.8,
                      borderRadius: 100
                    }}
                  />

                  <View
                    style={{
                      height: 5,
                      width: 5,
                      backgroundColor: colors.paragraph,
                      opacity: 0.8,
                      borderRadius: 100
                    }}
                  />
                </View>

                <View
                  style={{
                    marginTop: Spacing.LEVEL_0,
                    gap: Spacing.LEVEL_0 - 1
                  }}
                >
                  <View
                    style={{
                      width: "72%",
                      height: 4,
                      borderRadius: Radius.XXS,
                      backgroundColor: colors.paragraph,
                      opacity: 0.4
                    }}
                  />
                  <View
                    style={{
                      width: "72%",
                      height: 4,
                      borderRadius: Radius.XXS,
                      backgroundColor: colors.paragraph,
                      opacity: 0.4
                    }}
                  />
                  <View
                    style={{
                      width: "58%",
                      height: 4,
                      borderRadius: Radius.XXS,
                      backgroundColor: colors.paragraph,
                      opacity: 0.4
                    }}
                  />
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              width: "100%",
              borderBottomWidth: 1,
              borderBottomColor: themeColors.colors.primary.separator,
              marginVertical: Spacing.LEVEL_3
            }}
          />

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <Heading
              size={AppFontSize.xl}
              color={themeColors.colors.primary.heading}
            >
              {theme.name}
            </Heading>

            {theme.homepage ? (
              <View
                style={{
                  flexDirection: "row"
                }}
              >
                <Paragraph
                  size={AppFontSize.xxs}
                  color={colors.accent}
                  fontFamily="SEMI_BOLD"
                  style={{
                    textAlignVertical: "center"
                  }}
                  onPress={() => {
                    Linking.openURL(theme.homepage as string);
                  }}
                >
                  {strings.visitHomePage()}{" "}
                  <AppIcon
                    color={colors.accent}
                    name="arrow-right"
                    iconFamily="notesnook"
                    size={10}
                  />
                </Paragraph>
              </View>
            ) : null}
          </View>

          <Paragraph
            style={{
              marginTop: Spacing.LEVEL_0
            }}
            color={themeColors.colors.primary.paragraph}
          >
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
              marginTop: Spacing.LEVEL_1,
              flexDirection: "row",
              gap: Spacing.LEVEL_2
            }}
          >
            <View
              style={{
                backgroundColor: themeColors.colors.secondary.background,
                padding: Spacing.LEVEL_1,
                borderRadius: Radius.XS,
                flex: 1
              }}
            >
              <Paragraph
                size={AppFontSize.sm}
                color={themeColors.colors.secondary.paragraph}
              >
                {strings.version()} {theme.version}
              </Paragraph>
            </View>

            <View
              style={{
                backgroundColor: themeColors.colors.secondary.background,
                padding: Spacing.LEVEL_1,
                borderRadius: Radius.XS,
                flex: 1
              }}
            >
              <Paragraph
                size={AppFontSize.sm}
                color={themeColors.colors.secondary.paragraph}
              >
                {theme.license}
              </Paragraph>
            </View>
          </View>
        </View>

        {darkTheme.id === theme.id || lightTheme.id === theme.id ? (
          <Pressable
            onPress={applyTheme}
            type="secondary"
            style={{
              paddingVertical: Spacing.LEVEL_2,
              borderWidth: 0
            }}
          >
            <Heading
              color={themeColors.colors.secondary.buttonForeground}
              size={AppFontSize.md}
            >
              {darkTheme.id === theme.id
                ? strings.appliedDark()
                : strings.appliedLight()}
            </Heading>
          </Pressable>
        ) : (
          <Button
            style={{
              width: "100%",
              marginBottom: Spacing.LEVEL_2,
              borderWidth: 0,
              paddingVertical: Spacing.LEVEL_2
            }}
            noborder
            onPress={applyTheme}
            textStyle={{
              color: themeColors.colors.secondary.buttonForeground
            }}
            title={
              theme.colorScheme === "dark"
                ? strings.setAsDarkTheme()
                : strings.setAsLightTheme()
            }
            type="secondary"
          />
        )}
      </View>
    </>
  );
};
