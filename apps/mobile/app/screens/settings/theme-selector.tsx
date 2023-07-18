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
import { THEME_COMPATIBILITY_VERSION, useThemeColors } from "@notesnook/theme";
import type {
  CompiledThemeDefinition,
  ThemeMetadata,
  ThemesRouter
} from "@notesnook/themes-server";
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
import { db } from "../../common/database";
import SheetProvider from "../../components/sheet-provider";
import { Button } from "../../components/ui/button";
import Input from "../../components/ui/input";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastEvent, presentSheet } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { getElevationStyle } from "../../utils/elevation";
import { MenuItemsList } from "../../utils/constants";

const THEME_SERVER_URL = "http://192.168.43.127:9000";
//@ts-ignore
export const themeTrpcClient = createTRPCProxyClient<ThemesRouter>({
  links: [
    httpBatchLink({
      url: THEME_SERVER_URL
    })
  ]
});

function ThemeSelector() {
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

  const select = (item: Partial<ThemeMetadata>) => {
    presentSheet({
      context: item.id,
      component: (ref, close) => <ThemeSetter close={close} theme={item} />
    });
  };
  const renderItem = ({ item }: { item: ThemeMetadata; index: number }) => {
    const colors = item.previewColors;

    return (
      <>
        <SheetProvider context={item.id} />
        <TouchableOpacity
          activeOpacity={0.9}
          style={{
            borderRadius: 10,
            padding: 6,
            marginBottom: 10,
            flexShrink: 1
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
                borderRadius: 5
              }}
            >
              {MenuItemsList.map((item, index) => (
                <View
                  key={item.name}
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
                borderRadius: 5,
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
                    Notes
                  </Heading>
                </View>

                <Icon name="magnify" color={colors.list.heading} size={7} />
              </View>
            </View>
          </View>

          <Heading size={SIZE.md} color={themeColors.primary.heading}>
            {item.name}
          </Heading>
          {/* <Paragraph color={themeColors.primary?.paragraph}>
            {item.description}
          </Paragraph> */}
          <Paragraph size={SIZE.xs} color={themeColors.secondary?.paragraph}>
            By {item.authors?.[0].name}
          </Paragraph>
        </TouchableOpacity>
      </>
    );
  };
  let resetTimer: NodeJS.Timeout;
  //let refetchTimer: NodeJS.Timeout;
  const onSearch = (text: string) => {
    clearTimeout(resetTimer as NodeJS.Timeout);
    resetTimer = setTimeout(() => {
      setSearchQuery(text);
      // clearTimeout(refetchTimer);
      // refetchTimer = setTimeout(() => {
      //   themes.refetch();
      // }, 300);
    }, 400);
  };

  function getThemes(): ThemeMetadata[] {
    const pages = themes.data?.pages;
    return (
      pages
        ?.map((page) => {
          return page.themes;
        })
        .flat() || []
    );
  }

  return (
    <View
      style={{
        flex: 1,
        padding: 12
      }}
    >
      <View
        style={{
          paddingHorizontal: 4,
          marginBottom: 12
        }}
      >
        <Input onChangeText={onSearch} placeholder="Search themes" />

        <View
          style={{
            flexDirection: "row",
            columnGap: 10
          }}
        >
          <Button
            height={35}
            style={{ borderRadius: 100 }}
            type={colorScheme === "" || !colorScheme ? "accent" : "grayBg"}
            title="All"
            onPress={() => {
              setColorScheme("");
            }}
          />
          <Button
            style={{ borderRadius: 100 }}
            height={35}
            type={colorScheme === "dark" ? "accent" : "grayBg"}
            title="Dark"
            onPress={() => {
              setColorScheme("dark");
            }}
          />
          <Button
            style={{ borderRadius: 100 }}
            height={35}
            type={colorScheme === "light" ? "accent" : "grayBg"}
            title="Light"
            onPress={() => {
              setColorScheme("light");
            }}
          />
        </View>
      </View>

      <MasonryFlashList
        numColumns={2}
        data={getThemes()}
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
                No results found for {searchQuery}
              </Paragraph>
            ) : (
              <Paragraph>No themes found.</Paragraph>
            )}
          </View>
        }
        estimatedItemSize={200}
        renderItem={renderItem}
        onEndReachedThreshold={0.1}
        onEndReached={() => {
          themes.fetchNextPage();
        }}
      />
    </View>
  );
}

const trpc = createTRPCReact<ThemesRouter>();
export default function ThemeSelectorWithQueryClient() {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    //@ts-ignore
    trpc.createClient({
      links: [
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
  close
}: {
  theme: Partial<CompiledThemeDefinition>;
  close?: (ctx?: string) => void;
}) => {
  const themeColors = useThemeColors();

  const colors = theme?.previewColors;

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
                  borderRadius: 5
                }}
              >
                {MenuItemsList.map((item, index) => (
                  <View
                    key={item.name}
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
                  borderRadius: 5,
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
                      Notes
                    </Heading>
                  </View>

                  <Icon name="magnify" color={colors?.list.heading} size={7} />
                </View>
              </View>
            </View>
          </View>

          <Heading size={SIZE.md} color={themeColors.colors.primary.heading}>
            {theme.name}
          </Heading>
          <Paragraph color={themeColors.colors.primary.paragraph}>
            {theme.description}
          </Paragraph>

          <Paragraph
            size={SIZE.xs}
            color={themeColors.colors.secondary.paragraph}
          >
            By {theme.authors?.[0]?.name}
          </Paragraph>
          <View
            style={{
              marginTop: 5,
              flexDirection: "column",
              rowGap: 3
            }}
          >
            <Paragraph
              size={SIZE.xs}
              color={themeColors.colors.secondary.paragraph}
            >
              Version {theme.version}
            </Paragraph>

            <Paragraph
              size={SIZE.xs}
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
                  size={SIZE.xs}
                  color={themeColors.colors.secondary.accent}
                  onPress={() => {
                    Linking.openURL(theme.homepage as string);
                  }}
                >
                  Visit homepage
                </Paragraph>
              </View>
            ) : null}
          </View>
        </View>

        <Button
          style={{
            width: "100%",
            marginBottom: 10
          }}
          onPress={async () => {
            if (!theme.id) return;
            try {
              const user = await db.user?.getUser();
              const fullTheme = await themeTrpcClient.installTheme.query({
                compatibilityVersion: THEME_COMPATIBILITY_VERSION,
                id: theme.id,
                userId: user?.id
              });
              if (!fullTheme) return;
              theme.colorScheme === "dark"
                ? useThemeStore.getState().setDarkTheme(fullTheme)
                : useThemeStore.getState().setLightTheme(fullTheme);
              ToastEvent.show({
                heading: `${theme.name} applied successfully`,
                type: "success",
                context: "global"
              });
            } catch (e) {
              console.log("Error", e);
            }

            setTimeout(() => {
              close?.();
            });
          }}
          title={
            theme.colorScheme === "dark"
              ? "Set as dark theme"
              : "Set as light theme"
          }
          type="grayAccent"
        />
      </View>
    </>
  );
};
