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
import { SettingsCard } from "../../../components/settings-ui";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { Box, Button, Flex, Text } from "@theme-ui/components";
import { CheckSvgIcon, Loading, SearchIcon } from "../../../components/icons";
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
import Field from "../../../components/field";
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
        <Flex sx={{ flexDirection: "column", mt: "-5px" }}>
          <ThemesList />
        </Flex>
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
      description: strings.defaultDarkThemeDesc(),
      previewColors: getPreviewColors(darkTheme)
    },
    {
      ...lightTheme,
      description: strings.defaultLightThemeDesc(),
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
        showToast("success", strings.themeApplied(theme.name));
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
      <SettingsCard sx={{ gap: "spacing2" }}>
        <Text
          variant="body"
          sx={{
            fontSize: "sm",
            fontWeight: 500,
            lineHeight: 1,
            color: "heading"
          }}
        >
          {strings.selectTheme()}
        </Text>
        <Field
          id="search-themes"
          name="search-themes"
          variant="clean"
          leftIcon={SearchIcon}
          placeholder={strings.searchThemes()}
          sx={{ gap: 0, m: 0, width: "100%", height: "40px" }}
          styles={{
            input: {
              m: 0,
              py: "spacing6",
              pr: "spacing4",
              pl: "spacing10",
              fontSize: "xs",
              color: "paragraph",
              bg: "background-secondary",
              borderRadius: "dialog",
              "::placeholder": {
                color: "paragraph-secondary",
                textAlign: "start"
              }
            }
          }}
          onChange={debounce((e) => setSearchQuery(e.target.value), 500)}
        />
      </SettingsCard>

      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          mt: "spacing6"
        }}
      >
        <Flex sx={{ gap: "spacing4" }}>
          {COLOR_SCHEMES.map((filter) => {
            const isSelected = colorScheme === filter.id;
            return (
              <Button
                key={filter.id}
                variant="secondary"
                onClick={() => {
                  setColorScheme(filter.id);
                }}
                sx={{
                  borderRadius: "radius2",
                  minWidth: 93,
                  px: "spacing4",
                  py: "spacing5",
                  flexShrink: 0,
                  fontSize: "sm",
                  fontWeight: isSelected ? 500 : 400,
                  lineHeight: 1,
                  border: "1px solid",
                  borderColor: isSelected ? "transparent" : "border",
                  bg: isSelected ? "background-selected" : "transparent",
                  color: isSelected ? "heading" : "paragraph",
                  ":hover": {
                    bg: isSelected ? "background-selected" : "hover"
                  }
                }}
              >
                {filter.title}
              </Button>
            );
          })}
        </Flex>

        <Button
          variant="new_secondary"
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
              showToast("success", strings.themeApplied(theme.name));
            }
          }}
          sx={{
            px: "spacing4",
            py: "spacing5",
            flexShrink: 0,
            fontSize: "sm",
            fontWeight: 600,
            lineHeight: 1,
            borderRadius: "radius2",
            border: "none"
          }}
        >
          {strings.loadFromFile()}
        </Button>
      </Flex>

      {/* clip the negative gutter margin so the settings pane does not scroll sideways */}
      <Box sx={{ mt: "spacing6", overflowX: "clip" }}>
        <Box sx={{ mx: "-7.5px" }}>
          {themes.isInitialLoading ? (
            <Loader title={strings.loadingThemes()} />
          ) : (
            <VirtualizedGrid
              columns={2}
              items={items}
              getItemKey={(index) => items[index].id}
              estimatedSize={330}
              mode="dynamic"
              onEndReached={() =>
                themes.hasNextPage ? themes.fetchNextPage() : null
              }
              renderItem={({ item: theme }) => (
                <Box sx={{ px: "7.5px", pb: "spacing6", height: "100%" }}>
                  <ThemeItem
                    key={theme.id}
                    theme={theme}
                    isApplied={isThemeCurrentlyApplied(theme.id)}
                    isApplying={isApplying}
                    setTheme={setTheme}
                  />
                </Box>
              )}
            />
          )}
          {!themes.isInitialLoading && themes.isFetching ? (
            <Flex sx={{ justifyContent: "center" }}>
              <Loading size={15} color="accent" />
            </Flex>
          ) : null}
        </Box>
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
        gap: "spacing6",
        cursor: "pointer",
        p: "spacing4",
        border: "1px solid",
        borderColor: isApplied ? "transparent" : "border",
        borderRadius: "radius4",
        bg: isApplied ? "background-selected" : "transparent",
        ":hover": {
          bg: isApplied ? "background-selected" : "hover",
          borderColor: isApplied ? "transparent" : "hover",
          ".set-as-button": { visibility: "visible" }
        }
      }}
      onClick={async () => {
        if (await ThemeDetailsDialog.show({ theme })) {
          await setTheme(theme);
        }
      }}
    >
      <Box
        sx={{
          position: "relative",
          pt: isApplied ? "12px" : 0
        }}
      >
        <ThemePreview theme={theme} selected={isApplied} />
        {isApplied ? (
          <Flex
            sx={{
              position: "absolute",
              top: 0,
              left: "89.8%",
              width: 26,
              height: 26,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "50%",
              bg: "accent"
            }}
          >
            <CheckSvgIcon size={15} color="accentForeground" />
          </Flex>
        ) : null}
      </Box>
      <Flex
        sx={{
          justifyContent: "space-between",
          alignItems: "center",
          gap: "spacing4"
        }}
      >
        <Flex
          sx={{ flexDirection: "column", gap: "6px", minWidth: 0, flex: 1 }}
        >
          <Text
            variant="body"
            sx={{
              fontSize: "md",
              fontWeight: 500,
              lineHeight: 1,
              color: "heading",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {theme.name}
          </Text>
          <Text
            variant="body"
            sx={{
              fontSize: "xs",
              lineHeight: 1.2,
              color: "paragraph",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap"
            }}
          >
            {theme.authors[0].name}
          </Text>
          <Text
            variant="body"
            sx={{ fontSize: "xs", lineHeight: 1.2, color: "paragraph" }}
          >
            {theme.colorScheme === "dark" ? strings.dark() : strings.light()}
            &nbsp;
            {theme.totalInstalls
              ? `${theme.totalInstalls} ${strings.installs()}`
              : ""}
          </Text>
        </Flex>
        {isApplied ? null : (
          <Button
            className="set-as-button"
            variant="new_secondary"
            sx={{
              visibility: "hidden",
              flexShrink: 0,
              px: "spacing4",
              py: "spacing5",
              fontSize: "sm",
              fontWeight: 600,
              lineHeight: 1,
              borderRadius: "radius2",
              border: "none"
            }}
            onClick={(e) => {
              e.stopPropagation();
              setTheme(theme);
            }}
            disabled={isApplying}
          >
            {isApplying ? (
              <Loading color="accent" size={15} />
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
