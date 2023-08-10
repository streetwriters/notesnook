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

import { useQueryParams } from "@notesnook/web/src/navigation";
import ThemeBuilder from "./components/theme-builder";
import { useEffect, useState } from "react";
import { Loader } from "@notesnook/web/src/components/loader";
import { Flex } from "@theme-ui/components";
import { useStore } from "@notesnook/web/src/stores/theme-store";
import {
  loadThemeFromBase64,
  loadThemeFromPullRequest,
  loadThemeFromURL
} from "./utils/theme-loader";

export function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [{ from_pr, from_url, from_base64 }] = useQueryParams();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const theme = from_pr
          ? await loadThemeFromPullRequest(from_pr)
          : from_url
          ? await loadThemeFromURL(from_url)
          : from_base64
          ? loadThemeFromBase64(from_base64)
          : null;
        if (!theme) return;
        useStore.getState().setTheme(theme);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [from_pr, from_url, from_base64]);

  return (
    <Flex
      sx={{
        width: 260,
        flexShrink: 0,
        bg: "background",
        display: "flex",
        overflow: "hidden",
        flexDirection: "column",
        overflowY: "scroll",
        pt: 2,
        rowGap: 2,
        borderLeft: "1px solid var(--border)",
        zIndex: 1001
      }}
    >
      {isLoading ? (
        <Loader title="Downloading theme" text="Please wait..." />
      ) : (
        <ThemeBuilder />
      )}
    </Flex>
  );
}
