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

import { Theme } from "@notesnook/theme";
import { Editor } from "../types";
import { Flex, FlexProps } from "@theme-ui/components";
import { ThemeProvider } from "@emotion/react";
import { EditorFloatingMenus } from "./floating-menus";
import {
  getDefaultPresets,
  STATIC_TOOLBAR_GROUPS,
  MOBILE_ONLY_TOOLS
} from "./tool-definitions";
import { useEffect, useMemo } from "react";
import {
  ToolbarLocation,
  useIsMobile,
  useToolbarStore
} from "./stores/toolbar-store";
import { ToolbarDefinition } from "./types";
import { ToolbarGroup } from "./components/toolbar-group";
import {
  EditorContext,
  PopupRenderer
} from "../components/popup-presenter/popuprenderer";

type ToolbarProps = FlexProps & {
  theme: Theme;
  editor: Editor | null;
  location: ToolbarLocation;
  tools?: ToolbarDefinition;
  defaultFontFamily: string;
  defaultFontSize: number;
};

export function Toolbar(props: ToolbarProps) {
  const {
    editor,
    theme,
    location,
    tools = getDefaultPresets().default,
    defaultFontFamily,
    defaultFontSize,
    sx,
    ...flexProps
  } = props;
  const isMobile = useIsMobile();
  const toolbarTools = useMemo(
    () =>
      isMobile
        ? [...STATIC_TOOLBAR_GROUPS, ...MOBILE_ONLY_TOOLS, ...tools]
        : [...STATIC_TOOLBAR_GROUPS, ...tools],
    [tools, isMobile]
  );

  const setToolbarLocation = useToolbarStore(
    (store) => store.setToolbarLocation
  );
  const setDefaultFontFamily = useToolbarStore((store) => store.setFontFamily);
  const setDefaultFontSize = useToolbarStore((store) => store.setFontSize);

  useEffect(() => {
    setToolbarLocation(location);
  }, [location, setToolbarLocation]);

  useEffect(() => {
    setDefaultFontFamily(defaultFontFamily);
    setDefaultFontSize(defaultFontSize);
  }, [
    defaultFontFamily,
    defaultFontSize,
    setDefaultFontFamily,
    setDefaultFontSize
  ]);

  if (!editor) return null;
  return (
    <ThemeProvider theme={theme}>
      <EditorContext.Provider value={editor}>
        <PopupRenderer editor={editor}>
          <Flex
            className="editor-toolbar"
            sx={{
              ...sx,
              flexWrap: isMobile ? "nowrap" : "wrap",
              overflowX: isMobile ? "auto" : "hidden"
            }}
            {...flexProps}
          >
            {toolbarTools.map((tools) => {
              return (
                <ToolbarGroup
                  key={tools.join("")}
                  tools={tools}
                  editor={editor}
                  sx={{
                    flexShrink: 0,
                    pr: 2,
                    mr: 2,
                    borderRight: "1px solid var(--border)",
                    ":last-of-type": { mr: 0, pr: 0, borderRight: "none" }
                  }}
                />
              );
            })}
          </Flex>
          <EditorFloatingMenus editor={editor} />
        </PopupRenderer>
      </EditorContext.Provider>
    </ThemeProvider>
  );
}
