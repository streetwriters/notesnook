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
import { ThemeDefinition, useThemeColors } from "@notesnook/theme";
import type { ThemesRouter } from "@notesnook/themes-server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import React, { useState } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import SheetProvider from "../../components/sheet-provider";
import { Button } from "../../components/ui/button";
import Heading from "../../components/ui/typography/heading";
import Paragraph from "../../components/ui/typography/paragraph";
import { ToastEvent, presentSheet } from "../../services/event-manager";
import { useThemeStore } from "../../stores/use-theme-store";
import { SIZE } from "../../utils/size";
import { MasonryFlashList } from "@shopify/flash-list";
import Input from "../../components/ui/input";

//@ts-ignore
const trpcClient = createTRPCProxyClient<ThemesRouter>({
  links: [
    httpBatchLink({
      url: "http://192.168.8.103:1000"
    })
  ]
});

function ThemeSelector() {
  const { colors } = useThemeColors();
  const themes = trpc.themes.useInfiniteQuery(
    {
      limit: 10
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );
  const [searchQuery, setSearchQuery] = useState<string>();
  const searchResults = trpc.search.useInfiniteQuery(
    { limit: 10, query: searchQuery || "" },
    {
      enabled: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );

  const select = (item: Partial<ThemeDefinition>) => {
    presentSheet({
      context: item.id,
      component: (ref, close) => <ThemeSetter close={close} theme={item} />
    });
  };
  const renderItem = ({
    item
  }: {
    item: Omit<ThemeDefinition, "scopes" | "codeBlockCss">;
    index: number;
  }) => {
    const colors = item.previewColors;

    return (
      <>
        <SheetProvider context={item.id} />
        <TouchableOpacity
          activeOpacity={0.9}
          style={{
            backgroundColor: colors?.background,
            borderRadius: 10,
            padding: 12,
            marginBottom: 10,
            flexShrink: 1,
            borderWidth: 1,
            borderColor: colors?.accent,
            marginHorizontal: 5
          }}
          onPress={() => select(item)}
        >
          <View
            style={{
              backgroundColor: colors?.accent,
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
                backgroundColor: colors?.shade,
                height: 40,
                borderRadius: 10,
                marginRight: 6
              }}
            />

            <View
              style={{
                flex: 1,
                backgroundColor: colors?.secondaryBackground,
                height: 40,
                borderRadius: 10
              }}
            />
          </View>
          <Heading size={SIZE.md} color={colors?.heading}>
            {item.name}
          </Heading>
          <Paragraph color={colors?.paragraph}>{item.description}</Paragraph>

          <Paragraph size={SIZE.xs} color={colors?.paragraph}>
            By {item.author}
          </Paragraph>
        </TouchableOpacity>
      </>
    );
  };
  let resetTimer: NodeJS.Timeout;
  let refetchTimer: NodeJS.Timeout;
  const onSearch = (text: string) => {
    clearTimeout(resetTimer as NodeJS.Timeout);
    resetTimer = setTimeout(() => {
      setSearchQuery(text);
      clearTimeout(refetchTimer);
      refetchTimer = setTimeout(() => {
        searchResults.refetch();
      }, 300);
    }, 500);
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 12
      }}
    >
      <View
        style={{
          paddingHorizontal: 4
        }}
      >
        <Input onChangeText={onSearch} placeholder="Search themes" />
      </View>

      <MasonryFlashList
        numColumns={2}
        data={
          searchQuery
            ? searchResults?.data?.pages
                .map((page) => {
                  return page.themes;
                })
                .flat()
            : themes.data?.pages
                .map((page) => {
                  return page.themes;
                })
                .flat() || []
        }
        ListEmptyComponent={
          <View
            style={{
              height: 100,
              width: "100%",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {themes.isLoading || searchResults.isLoading ? (
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
          if (searchQuery) {
            console.log("fetching next page");
            searchResults.fetchNextPage();
          } else {
            themes.fetchNextPage();
          }
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
          url: "http://192.168.8.103:1000"
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
  theme: Partial<ThemeDefinition>;
  close?: (ctx?: string) => void;
}) => {
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
            backgroundColor: colors?.background,
            borderRadius: 10,
            marginBottom: 12,
            padding: 12
          }}
        >
          <View
            style={{
              backgroundColor: colors?.accent,
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
                backgroundColor: colors?.shade,
                height: 50,
                borderRadius: 10,
                marginRight: 6
              }}
            />

            <View
              style={{
                flex: 1,
                backgroundColor: colors?.secondaryBackground,
                height: 50,
                borderRadius: 10
              }}
            />
          </View>

          <Heading size={SIZE.md} color={colors?.heading}>
            {theme.name}
          </Heading>
          <Paragraph color={colors?.paragraph}>{theme.description}</Paragraph>

          <Paragraph size={SIZE.xs} color={colors?.paragraph}>
            By {theme.author}
          </Paragraph>
        </View>

        <Button
          style={{
            width: "100%",
            marginBottom: 10
          }}
          onPress={async () => {
            if (!theme.id) return;
            try {
              const fullTheme = await trpcClient.getTheme.query(theme.id);
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
          type="grayBg"
        />
      </View>
    </>
  );
};
