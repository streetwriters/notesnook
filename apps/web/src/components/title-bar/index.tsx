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

import { Button } from "@theme-ui/components";
import { desktop } from "../../common/desktop-bridge";
import { useWindowControls } from "../../hooks/use-window-controls";
import { getPlatform } from "../../utils/platform";
import {
  WindowClose,
  WindowMaximize,
  WindowMinimize,
  WindowRestore
} from "../icons";
import { BaseThemeProvider } from "../theme-provider";
import { strings } from "@notesnook/intl";

export const TITLE_BAR_HEIGHT = IS_DESKTOP_APP ? 37.8 : 0;
export function TitleBar() {
  const { isMaximized, isFullscreen, hasNativeWindowControls } =
    useWindowControls();

  const tools = [
    {
      title: strings.minimize(),
      icon: WindowMinimize,
      hidden: hasNativeWindowControls || isFullscreen,
      enabled: true,
      onClick: () => desktop?.window.minimze.mutate()
    },
    {
      title: isMaximized ? strings.restore() : strings.maximize(),
      icon: isMaximized ? WindowRestore : WindowMaximize,
      enabled: true,
      hidden: hasNativeWindowControls || isFullscreen,
      onClick: () =>
        isMaximized
          ? desktop?.window.restore.mutate()
          : desktop?.window.maximize.mutate()
    },
    {
      title: strings.close(),
      icon: WindowClose,
      hidden: hasNativeWindowControls || isFullscreen,
      enabled: true,
      onClick: () => window.close()
    }
  ];

  return (
    <BaseThemeProvider
      scope="titleBar"
      sx={{
        background: "background",
        height: TITLE_BAR_HEIGHT,
        display: "flex",
        borderBottom: "1px solid var(--border)",
        ...(!isFullscreen && hasNativeWindowControls
          ? getPlatform() === "darwin"
            ? { pl: "calc(100vw - env(titlebar-area-width))" }
            : { pr: "calc(100vw - env(titlebar-area-width))" }
          : { pr: 0 })
      }}
      injectCssVars
    >
      {getPlatform() !== "darwin" || isFullscreen ? (
        <svg
          className="titlebarLogo"
          style={{
            alignSelf: "center",
            height: 16,
            width: 12,
            marginRight: 10,
            marginLeft: 10
          }}
        >
          <use href="#themed-logo" />
        </svg>
      ) : null}
      <div
        id="titlebar-portal-container"
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden"
        }}
      />
      {tools.map((tool) => (
        <Button
          data-test-id={tool.title}
          disabled={!tool.enabled}
          variant={tool.title === "Close" ? "error" : "secondary"}
          title={tool.title}
          key={tool.title}
          sx={{
            height: "100%",
            alignItems: "center",
            bg: "transparent",
            display: tool.hidden ? "none" : "flex",
            borderRadius: 0,
            flexShrink: 0,
            "&:hover svg path": {
              fill:
                tool.title === "Close"
                  ? "var(--accentForeground-error) !important"
                  : "var(--icon)"
            }
          }}
          onClick={tool.onClick}
        >
          <tool.icon size={18} />
        </Button>
      ))}
    </BaseThemeProvider>
  );
}
