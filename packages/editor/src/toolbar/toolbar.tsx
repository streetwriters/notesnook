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

import { Flex, FlexProps } from "@theme-ui/components";
import {
  getDefaultPresets,
  STATIC_TOOLBAR_GROUPS,
  MOBILE_STATIC_TOOLBAR_GROUPS
} from "./tool-definitions";
import { useEffect, useMemo } from "react";
import { Editor } from "../types";
import { ToolbarGroup } from "./components/toolbar-group";
import { EditorFloatingMenus } from "./floating-menus";
import {
  ToolbarLocation,
  useIsMobile,
  useToolbarStore
} from "./stores/toolbar-store";
import { ToolbarDefinition } from "./types";

type ToolbarProps = FlexProps & {
  editor: Editor | null;
  location: ToolbarLocation;
  tools?: ToolbarDefinition;
  defaultFontFamily: string;
  defaultFontSize: number;
};

export function Toolbar(props: ToolbarProps) {
  const {
    editor,
    location,
    tools = getDefaultPresets().default,
    defaultFontFamily,
    defaultFontSize,
    sx,
    className = "",
    ...flexProps
  } = props;
  const isMobile = useIsMobile();
  const toolbarTools = useMemo(
    () =>
      isMobile
        ? [...MOBILE_STATIC_TOOLBAR_GROUPS, ...tools]
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
    <>
      <Flex
        className={["editor-toolbar", className].join(" ")}
        sx={{
          ...sx,
          flexWrap: isMobile ? "nowrap" : "wrap",
          overflowX: isMobile ? "auto" : "hidden",
          bg: "background",
          borderRadius: isMobile ? "0px" : "default"
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
                borderRight: "1px solid var(--border)",
                ":last-of-type": { borderRight: "none" },
                alignItems: "center"
              }}
            />
          );
        })}
      </Flex>
      <EditorFloatingMenus editor={editor} />
    </>
  );
}
