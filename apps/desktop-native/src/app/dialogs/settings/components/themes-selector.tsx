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

import { useCallback, useEffect, useRef, useState } from "react";
import { Button, Flex, Input, Text } from "@ui";
import { CheckCircleOutline, Loading } from "../../../components/icons";
import {
  THEME_COMPATIBILITY_VERSION,
  getPreviewColors,
  validateTheme,
  type ThemeDefinition
} from "@notesnook/theme";
import { debounce } from "@notesnook/common";
import { useStore as useThemeStore } from "../../../stores/theme-store";
import { useStore as useUserStore } from "../../../stores/user-store";
import { ThemesRouter } from "../../../common/themes-router";
import { ThemePreview } from "../../../components/theme-preview";
import { showToast } from "../../../utils/toast";
import { showFilePicker, readFile } from "../../../utils/file-picker";
import { VirtualizedGrid } from "../../../components/virtualized-grid";
import {
  ThemeDetailsDialog,
  type ThemeMetadata
} from "../../theme-details-dialog";
import { strings } from "@notesnook/intl";

const COLOR_SCHEMES = [
  { id: "all", title: strings.all() },
  { id: "dark", title: strings.dark() },
  { id: "light", title: strings.light() }
] as const;

type ThemeItemData = ThemeMetadata;

export function ThemesSelector() {
  const [searchQuery, setSearchQuery] = useState<string>();
  const [colorScheme, setColorScheme] = useState<"all" | "dark" | "light">(
    "all"
  );
  const [remote, setRemote] = useState<ThemeMetadata[]>([]);
  const [cursor, setCursor] = useState<number | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const requestId = useRef(0);
  const setCurrentTheme = useThemeStore((store) => store.setTheme);
  const user = useUserStore((store) => store.user);
  const darkTheme = useThemeStore((store) => store.darkTheme);
  const lightTheme = useThemeStore((store) => store.lightTheme);
  const isThemeCurrentlyApplied = useThemeStore(
    (store) => store.isThemeCurrentlyApplied
  );

  const load = useCallback(
    async (nextCursor?: number | null) => {
      const id = ++requestId.current;
      const filters: Parameters<
        typeof ThemesRouter.themes.query
      >[0]["filters"] = [];
      if (searchQuery) filters.push({ type: "term", value: searchQuery });
      if (colorScheme !== "all")
        filters.push({ type: "colorScheme", value: colorScheme });
      setIsFetching(true);
      try {
        const page = await ThemesRouter.themes.query({
          limit: 10,
          cursor: nextCursor,
          compatibilityVersion: THEME_COMPATIBILITY_VERSION,
          filters
        });
        if (id !== requestId.current) return;
        setRemote((current) =>
          nextCursor ? [...current, ...page.themes] : page.themes
        );
        setCursor(page.nextCursor);
      } catch (e) {
        if (e instanceof Error) showToast("error", e.message);
      } finally {
        if (id === requestId.current) {
          setIsLoading(false);
          setIsFetching(false);
        }
      }
    },
    [searchQuery, colorScheme]
  );

  useEffect(() => {
    load();
  }, [load]);

  const items: ThemeItemData[] = [
    {
      ...darkTheme,
      description: strings.defaultDarkThemeDesc(),
      previewColors: getPreviewColors(darkTheme)
    } as unknown as ThemeItemData,
    {
      ...lightTheme,
      description: strings.defaultLightThemeDesc(),
      previewColors: getPreviewColors(lightTheme)
    } as unknown as ThemeItemData,
    ...remote.filter((theme) => !isThemeCurrentlyApplied(theme.id))
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
        setCurrentTheme(fullTheme as ThemeDefinition);
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
    <Flex sx={{ flexDirection: "column" }}>
      <Input
        placeholder={strings.searchThemes()}
        sx={{ mt: 2 }}
        onChangeText={debounce((text: string) => setSearchQuery(text), 500)}
      />
      <Flex
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Flex sx={{ flexDirection: "row", mt: 2, gap: 1 }}>
          {COLOR_SCHEMES.map((filter) => (
            <Button
              key={filter.id}
              variant="secondary"
              onPress={() => setColorScheme(filter.id)}
              sx={{
                borderRadius: 100,
                minWidth: 50,
                py: 1,
                px: 2,
                flexShrink: 0,
                bg: colorScheme === filter.id ? "shade" : "transparent"
              }}
            >
              <Text
                sx={{
                  color: colorScheme === filter.id ? "accent" : "paragraph"
                }}
              >
                {filter.title}
              </Text>
            </Button>
          ))}
        </Flex>

        <Flex sx={{ flexDirection: "row", mt: 2, gap: 1 }}>
          <Button
            variant="secondary"
            onPress={async () => {
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
            sx={{ px: 3, flexShrink: 0 }}
          >
            <Text>{strings.loadFromFile()}</Text>
          </Button>
        </Flex>
      </Flex>

      <Flex sx={{ mt: 2, flexDirection: "column" }}>
        {isLoading ? (
          <Text variant="body">{strings.loadingThemes()}</Text>
        ) : (
          <VirtualizedGrid
            columns={2}
            items={items}
            getItemKey={(index) => items[index].id}
            estimatedSize={285}
            sx={{ height: 600 }}
            onEndReached={() => (cursor ? load(cursor) : null)}
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
        {!isLoading && isFetching ? <Loading color="accent" /> : null}
      </Flex>
    </Flex>
  );
}

type ThemeItemProps = {
  theme: ThemeItemData;
  isApplied: boolean;
  isApplying: boolean;
  setTheme: (theme: ThemeMetadata) => Promise<void>;
};

function ThemeItem(props: ThemeItemProps) {
  const { theme, isApplied, isApplying, setTheme } = props;

  return (
    <Flex
      onPress={async () => {
        if (await ThemeDetailsDialog.show({ theme })) {
          await setTheme(theme);
        }
      }}
      sx={{
        flexDirection: "column",
        flex: 1,
        cursor: "pointer",
        p: 2,
        border: "1px solid",
        borderColor: "transparent",
        borderRadius: "default",
        ":hover": { bg: "background-secondary", borderColor: "border" }
      }}
    >
      <ThemePreview theme={theme} />
      <Text variant="title" sx={{ mt: 1 }}>
        {theme.name}
      </Text>
      <Text variant="body">{theme.authors?.[0]?.name}</Text>
      <Flex
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <Text variant="subBody">
          {`${
            theme.colorScheme === "dark" ? strings.dark() : strings.light()
          }  ${
            theme.totalInstalls
              ? `${theme.totalInstalls} ${strings.installs()}`
              : ""
          }`}
        </Text>
        {isApplied ? (
          <CheckCircleOutline color="accent" size={20} />
        ) : (
          <Button
            variant="secondary"
            sx={{ bg: "background" }}
            onPress={() => setTheme(theme)}
            disabled={isApplying}
          >
            {isApplying ? (
              <Loading color="accent" size={18} />
            ) : (
              <Text>
                {theme.colorScheme === "dark"
                  ? strings.setAsDarkTheme()
                  : strings.setAsLightTheme()}
              </Text>
            )}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
