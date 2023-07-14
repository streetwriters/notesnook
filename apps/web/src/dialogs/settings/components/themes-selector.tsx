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
import type { ThemesRouter } from "@notesnook/themes-server";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import { VirtuosoGrid } from "react-virtuoso";
import { alpha, mix, shade } from "@theme-ui/color";
import {
  Circle,
  Monographs,
  Notebook,
  Notes,
  Plus,
  Reminders,
  StarOutline,
  Tag,
  Trash
} from "../../../components/icons";
import { THEME_COMPATIBILITY_VERSION } from "@notesnook/theme";

const THEME_SERVER_URL = "http://localhost:9000";
const themesRouter = createTRPCProxyClient<ThemesRouter>({
  links: [
    httpBatchLink({
      url: THEME_SERVER_URL
    })
  ]
});
const ThemesTRPC = createTRPCReact<ThemesRouter>();
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

function ThemesList() {
  const [searchQuery, setSearchQuery] = useState<string>();
  const [filters, setFilters] = useState<string[]>(["dark", "light"]);
  const themes = ThemesTRPC.themes.useInfiniteQuery(
    {
      limit: 10,
      compatibilityVersion: THEME_COMPATIBILITY_VERSION
    },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor
    }
  );
  // const searchResults = ThemesTRPC.search.useInfiniteQuery(
  //   { limit: 10, query: searchQuery || "" },
  //   {
  //     enabled: false,
  //     getNextPageParam: (lastPage) => lastPage.nextCursor
  //   }
  // );

  return (
    <>
      <Input placeholder="Search themes" sx={{ mt: 2 }} />
      <Flex sx={{ mt: 2, gap: 1 }}>
        {[
          { id: "dark", title: "Dark" },
          { id: "light", title: "Light" }
        ].map((filter) => (
          <Button
            key={filter.id}
            variant="secondary"
            onClick={() => {
              setFilters((filters) => {
                const copy = filters.slice();
                const index = copy.indexOf(filter.id);
                if (index > -1) copy.splice(index, 1);
                else copy.push(filter.id);
                if (copy.length < 1) return filters;
                return copy;
              });
            }}
            sx={{
              borderRadius: 100,
              minWidth: 50,
              py: 1,
              px: 2,
              flexShrink: 0,
              bg: filters.includes(filter.id) ? "shade" : "transparent",
              color: filters.includes(filter.id) ? "accent" : "paragraph"
            }}
          >
            {filter.title}
          </Button>
        ))}
      </Flex>
      <Box
        sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, mt: 2 }}
      >
        {themes.data?.pages
          .flatMap((a) => a.themes)
          .map((theme) => (
            <Flex
              key={theme.id}
              sx={{ flexDirection: "column", flex: 1, cursor: "pointer" }}
            >
              <Flex
                sx={{
                  position: "relative",
                  flexDirection: "column",
                  height: 200,
                  borderRadius: 10,
                  overflow: "hidden",
                  bg: alpha(theme.previewColors.accent, 0.2),
                  //m: 2,

                  border: `2px solid ${theme.previewColors.accent}`,
                  gap: 0,
                  transition: "all 300ms ease-out",
                  ":hover": {
                    gap: 1,
                    p: 1,
                    "&> div.ui": { gap: 1 },
                    "& *": { border: "none" }
                  }
                }}
              >
                <Flex
                  sx={{
                    borderRadius: "default",
                    p: "small",
                    position: "absolute",
                    bottom: 1,
                    right: 1
                  }}
                >
                  {[
                    theme.previewColors.accent,
                    theme.previewColors.paragraph,
                    theme.previewColors.background
                  ].map((color) => (
                    <Circle
                      key={color}
                      color={color}
                      size={18}
                      sx={{
                        ml: -12
                      }}
                    />
                  ))}
                </Flex>
                <Flex
                  className="ui"
                  sx={{ flex: 1, gap: 0, transition: "all 300ms ease-out" }}
                >
                  <Flex
                    className="navigation"
                    sx={{
                      bg: theme.previewColors.navigationMenu.background,
                      width: 20,
                      flexDirection: "column",
                      gap: 2,
                      py: 1,
                      borderRight: `1px solid ${theme.previewColors.border}`
                    }}
                  >
                    {[Notes, Notebook, StarOutline, Tag].map((Icon, index) => (
                      <Icon
                        key={index.toString()}
                        color={
                          index === 0
                            ? theme.previewColors.navigationMenu.accent
                            : theme.previewColors.navigationMenu.icon
                        }
                        size={8}
                      />
                    ))}
                  </Flex>
                  <Flex
                    className="list"
                    sx={{
                      bg: theme.previewColors.list.background,
                      flex: 0.3,
                      p: 1,
                      borderRight: `1px solid ${theme.previewColors.border}`
                    }}
                  >
                    <Flex
                      sx={{
                        justifyContent: "space-between",
                        width: 120
                      }}
                    >
                      <Text
                        variant="heading"
                        sx={{
                          color: theme.previewColors.list.heading,
                          fontSize: 7
                        }}
                      >
                        Notes
                      </Text>
                      <Plus
                        color="white"
                        size={8}
                        sx={{
                          bg: theme.previewColors.list.accent,
                          size: 10,
                          borderRadius: 100
                        }}
                      />
                    </Flex>
                  </Flex>
                  <Flex
                    className="editor"
                    sx={{ bg: theme.previewColors.editor, flex: 1 }}
                  />
                </Flex>
                <Flex
                  className="statusbar"
                  sx={{
                    height: 10,
                    bg: theme.previewColors.statusBar.background,
                    px: 1,
                    alignItems: "center",
                    gap: 1,
                    borderTop: `1px solid ${theme.previewColors.border}`
                  }}
                >
                  <Circle color={theme.previewColors.statusBar.icon} size={3} />
                  <Text
                    variant="subBody"
                    sx={{
                      fontSize: 5,
                      color: theme.previewColors.statusBar.paragraph
                    }}
                  >
                    johndoe@email.com
                  </Text>
                </Flex>
              </Flex>
              <Text variant="title" sx={{ mt: 1 }}>
                {theme.name}
              </Text>
              <Text variant="body">{theme.author}</Text>
            </Flex>
          ))}
      </Box>
    </>
  );
}
