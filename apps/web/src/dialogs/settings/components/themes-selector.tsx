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
import { CheckCircleOutline } from "../../../components/icons";
import { THEME_COMPATIBILITY_VERSION } from "@notesnook/theme";
import { debounce } from "@notesnook/common";
import { useStore as useThemeStore } from "../../../stores/theme-store";
import { useStore as useUserStore } from "../../../stores/user-store";
import {
  ThemesRouter,
  THEME_SERVER_URL,
  ThemesTRPC
} from "../../../common/themes-router";
import { ThemeMetadata } from "@notesnook/themes-server";
import { showThemeDetails } from "../../../common/dialog-controller";
import { ThemePreview } from "../../../components/theme-preview";
import { VirtuosoGrid } from "react-virtuoso";

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
  { id: "all", title: "All" },
  { id: "dark", title: "Dark" },
  { id: "light", title: "Light" }
] as const;

function ThemesList() {
  const [searchQuery, setSearchQuery] = useState<string>();
  const [colorScheme, setColorScheme] = useState<"all" | "dark" | "light">(
    "all"
  );
  const isThemeCurrentlyApplied = useThemeStore(
    (store) => store.isThemeCurrentlyApplied
  );
  const setCurrentTheme = useThemeStore((store) => store.setTheme);
  const user = useUserStore((store) => store.user);
  useThemeStore((store) => store.darkTheme);
  useThemeStore((store) => store.lightTheme);

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
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );

  const setTheme = useCallback(
    async (theme: ThemeMetadata) => {
      if (isThemeCurrentlyApplied(theme.id)) return;
      const fullTheme = await ThemesRouter.installTheme.query({
        id: theme.id,
        compatibilityVersion: THEME_COMPATIBILITY_VERSION,
        userId: user?.id
      });
      if (!fullTheme) return;
      setCurrentTheme(fullTheme);
    },
    [isThemeCurrentlyApplied, setCurrentTheme, user?.id]
  );

  return (
    <>
      <Input
        placeholder="Search themes"
        sx={{ mt: 2 }}
        onChange={debounce((e) => setSearchQuery(e.target.value), 500)}
      />
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
      <Box
        sx={{
          ".virtuoso-grid-list": {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2
          },
          mt: 2
        }}
      >
        <VirtuosoGrid
          style={{ height: 700 }}
          data={themes.data?.pages.flatMap((a) => a.themes) || []}
          endReached={() =>
            themes.hasNextPage ? themes.fetchNextPage() : null
          }
          itemContent={(_index, theme) => (
            <Flex
              key={theme.id}
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
                  ".set-as-button": { opacity: 1 }
                }
              }}
              onClick={async () => {
                if (await showThemeDetails(theme)) {
                  await setTheme(theme);
                }
              }}
            >
              <ThemePreview theme={theme} />
              <Text variant="title" sx={{ mt: 1 }}>
                {theme.name}
              </Text>
              <Text variant="body">{theme.authors[0].name}</Text>
              <Flex
                sx={{ justifyContent: "space-between", alignItems: "center" }}
              >
                <Text variant="subBody">{theme.totalInstalls} installs</Text>
                {isThemeCurrentlyApplied(theme.id) ? (
                  <CheckCircleOutline color="accent" size={20} />
                ) : (
                  <Button
                    className="set-as-button"
                    variant="secondary"
                    sx={{ opacity: 0, bg: "background" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setTheme(theme);
                    }}
                  >
                    Set as {theme.colorScheme}
                  </Button>
                )}
              </Flex>
            </Flex>
          )}
        />
      </Box>
    </>
  );
}
