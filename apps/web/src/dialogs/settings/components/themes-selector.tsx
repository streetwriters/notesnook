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
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import { CheckCircleOutline, Loading } from "../../../components/icons";
import {
  THEME_COMPATIBILITY_VERSION,
  getPreviewColors,
  validateTheme
} from "@notesnook/theme";
import { debounce } from "@notesnook/common";
import { useStore as useThemeStore } from "../../../stores/theme-store";
import { useStore as useUserStore } from "../../../stores/user-store";
import {
  ThemesRouter,
  THEME_SERVER_URL,
  ThemesTRPC
} from "../../../common/themes-router";
import { ThemeMetadata } from "@notesnook/themes-server";
import { ThemePreview } from "../../../components/theme-preview";
import { Loader } from "../../../components/loader";
import { showToast } from "../../../utils/toast";
import { showFilePicker, readFile } from "../../../utils/file-picker";
import { VirtualizedGrid } from "../../../components/virtualized-grid";
import { ThemeDetailsDialog } from "../../theme-details-dialog";
import { strings } from "@notesnook/intl";

const ThemesClient = ThemesTRPC.createClient({
  links: [
    httpBatchLink({
      url: THEME_SERVER_URL
    })
  ]
});
const ThemesQueryClient = new QueryClient();

export function ThemesSelector() {
  return (
    <ThemesTRPC.Provider client={ThemesClient} queryClient={ThemesQueryClient}>
      <QueryClientProvider client={ThemesQueryClient}>
        <ThemesList />
      </QueryClientProvider>
    </ThemesTRPC.Provider>
  );
}

const COLOR_SCHEMES = [
  { id: "all", title: strings.all() },
  { id: "dark", title: strings.dark() },
  { id: "light", title: strings.light() }
] as const;

function ThemesList() {
  const [searchQuery, setSearchQuery] = useState<string>();
  const [colorScheme, setColorScheme] = useState<"all" | "dark" | "light">(
    "all"
  );

  const [isApplying, setIsApplying] = useState(false);
  const setCurrentTheme = useThemeStore((store) => store.setTheme);
  const user = useUserStore((store) => store.user);
  const darkTheme = useThemeStore((store) => store.darkTheme);
  const lightTheme = useThemeStore((store) => store.lightTheme);
  const isThemeCurrentlyApplied = useThemeStore(
    (store) => store.isThemeCurrentlyApplied
  );
  const filters = [];
  if (searchQuery) filters.push({ type: "term" as const, value: searchQuery });
  if (colorScheme !== "all")
    filters.push({ type: "colorScheme" as const, value: colorScheme });

  const themes = ThemesTRPC.themes.useInfiniteQuery(
    {
      limit: 10,
      compatibilityVersion: THEME_COMPATIBILITY_VERSION,
      filters
    },
    {
      keepPreviousData: true,
      select: (themes) => ({
        pageParams: themes.pageParams,
        pages: themes.pages.map((page) => ({
          nextCursor: page.nextCursor,
          themes: page.themes.filter(
            (theme) => !isThemeCurrentlyApplied(theme.id)
          )
        }))
      }),
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );

  const items = [
    {
      ...darkTheme,
      previewColors: getPreviewColors(darkTheme)
    },
    {
      ...lightTheme,
      previewColors: getPreviewColors(lightTheme)
    },
    ...(themes.data?.pages.flatMap((a) => a.themes) || [])
  ];

  const setTheme = useCallback(
    async (theme: ThemeMetadata) => {
      if (isThemeCurrentlyApplied(theme.id)) return;
      setIsApplying(true);
      try {
        const fullTheme = await ThemesRouter.installTheme.query({
          id: theme.id,
          compatibilityVersion: THEME_COMPATIBILITY_VERSION,
          userId: user?.id
        });
        if (!fullTheme) return;
        setCurrentTheme(fullTheme);
      } catch (e) {
        console.error(e);
        if (e instanceof Error)
          showToast(
            "error",
            `${strings.failedToInstallTheme()} ${strings.error()}: ` + e.message
          );
      } finally {
        setIsApplying(false);
      }
    },
    [isThemeCurrentlyApplied, setCurrentTheme, user?.id]
  );

  return (
    <>
      <Input
        placeholder={strings.searchThemes()}
        sx={{ mt: 2 }}
        onChange={debounce((e) => setSearchQuery(e.target.value), 500)}
      />
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Flex sx={{ mt: 2, gap: 1 }}>
          {COLOR_SCHEMES.map((filter) => (
            <Button
              key={filter.id}
              variant="secondary"
              onClick={() => {
                setColorScheme(filter.id);
              }}
              sx={{
                borderRadius: 100,
                minWidth: 50,
                py: 1,
                px: 2,
                flexShrink: 0,
                bg: colorScheme === filter.id ? "shade" : "transparent",
                color: colorScheme === filter.id ? "accent" : "paragraph"
              }}
            >
              {filter.title}
            </Button>
          ))}
        </Flex>

        <Flex sx={{ mt: 2, gap: 1 }}>
          <Button
            variant="secondary"
            onClick={async () => {
              const [file] = await showFilePicker({
                acceptedFileTypes: "application/json"
              });
              if (!file) return;
              const theme = JSON.parse(await readFile(file));
              const { error } = validateTheme(theme);
              if (error) return showToast("error", error);

              if (
                await ThemeDetailsDialog.show({
                  theme: {
                    ...theme,
                    totalInstalls: 0,
                    previewColors: getPreviewColors(theme)
                  }
                })
              ) {
                setCurrentTheme(theme);
              }
            }}
            sx={{
              px: 3,
              flexShrink: 0
            }}
          >
            {strings.loadFromFile()}
          </Button>
        </Flex>
      </Flex>

      <Box
        sx={{
          mt: 2
        }}
      >
        {themes.isInitialLoading ? (
          <Loader title={strings.loadingThemes()} />
        ) : (
          <VirtualizedGrid
            columns={2}
            items={items}
            getItemKey={(index) => items[index].id}
            estimatedSize={285}
            mode="dynamic"
            onEndReached={() =>
              themes.hasNextPage ? themes.fetchNextPage() : null
            }
            renderItem={({ item: theme }) => (
              <ThemeItem
                key={theme.id}
                theme={theme}
                isApplied={isThemeCurrentlyApplied(theme.id)}
                isApplying={isApplying}
                setTheme={setTheme}
              />
            )}
          />
        )}
        {!themes.isInitialLoading && themes.isFetching ? (
          <Loading color="accent" sx={{ mt: 2 }} />
        ) : null}
      </Box>
    </>
  );
}

type ThemeItemProps = {
  theme: ThemeMetadata;
  isApplied: boolean;
  isApplying: boolean;
  setTheme: (theme: ThemeMetadata) => Promise<void>;
};
function ThemeItem(props: ThemeItemProps) {
  const { theme, isApplied, isApplying, setTheme } = props;

  return (
    <Flex
      sx={{
        flexDirection: "column",
        flex: 1,
        cursor: "pointer",
        p: 2,
        border: "1px solid transparent",
        borderRadius: "default",
        ":hover": {
          bg: "background-secondary",
          border: "1px solid var(--border)",
          ".set-as-button": { visibility: "visible" }
        }
      }}
      onClick={async () => {
        if (await ThemeDetailsDialog.show({ theme })) {
          await setTheme(theme);
        }
      }}
    >
      <ThemePreview theme={theme} />
      <Text variant="title" sx={{ mt: 1 }}>
        {theme.name}
      </Text>
      <Text variant="body">{theme.authors[0].name}</Text>
      <Flex sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Text variant="subBody">
          {theme.colorScheme === "dark" ? "Dark" : "Light"}
          &nbsp;&nbsp;
          {theme.totalInstalls ? `${theme.totalInstalls} installs` : ""}
        </Text>
        {isApplied ? (
          <CheckCircleOutline color="accent" size={20} />
        ) : (
          <Button
            className="set-as-button"
            variant="secondary"
            sx={{ visibility: "hidden", bg: "background" }}
            onClick={(e) => {
              e.stopPropagation();
              setTheme(theme);
            }}
            disabled={isApplying}
          >
            {isApplying ? (
              <Loading color="accent" size={18} />
            ) : theme.colorScheme === "dark" ? (
              strings.setAsDarkTheme()
            ) : (
              strings.setAsLightTheme()
            )}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
