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

import { q } from "../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../queries/use-query.js";
import { Flex, type SxProp } from "@ui";
import {
  getDefaultPresets,
  STATIC_TOOLBAR_GROUPS,
  MOBILE_STATIC_TOOLBAR_GROUPS,
  READONLY_MOBILE_STATIC_TOOLBAR_GROUPS,
  READONLY_MOBILE_TOOLBAR_NODES
} from "./tool-definitions.js";
import { useEffect, useMemo, type ReactNode } from "react";
import { ControllerToolbarGroup } from "./components/toolbar-group.js";
import {
  ToolbarLocation,
  toolbarRef,
  useIsMobile,
  useToolbarStore
} from "./stores/toolbar-store.js";
import { ToolbarDefinition } from "./types.js";
import type { EditorController } from "../controller.js";
import { PopupHost } from "../components/popup-presenter/index.js";

export type ControllerToolbarProps = {
  editor: EditorController;
  location: ToolbarLocation;
  tools?: ToolbarDefinition;
  defaultFontFamily: string;
  defaultFontSize: number;
  sx?: SxProp;
  className?: string;
  testID?: string;
  floatingMenus?: ReactNode;
};

export function ControllerToolbar(props: ControllerToolbarProps) {
  const {
    editor,
    location,
    tools = getDefaultPresets().default,
    defaultFontFamily,
    defaultFontSize,
    sx,
    testID = "editor-toolbar"
  } = props;
  const isMobile = useIsMobile();
  const isEditable = useEditorQuery(editor, q.editable(), true);
  const hasReadonlyNode = useEditorQuery(
    editor,
    q.isActive(READONLY_MOBILE_TOOLBAR_NODES),
    false
  );
  const toolbarTools = useMemo(
    () =>
      isMobile
        ? isEditable
          ? [...MOBILE_STATIC_TOOLBAR_GROUPS, ...tools]
          : READONLY_MOBILE_STATIC_TOOLBAR_GROUPS
        : isEditable
        ? [...STATIC_TOOLBAR_GROUPS, ...tools]
        : [],
    [tools, isEditable, isMobile]
  );

  const isEmptyReadonlyToolbar = isMobile && !isEditable && !hasReadonlyNode;

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

  return (
    <>
      {isEmptyReadonlyToolbar ? null : (
        <Flex
          ref={(ref) => {
            toolbarRef.current = ref;
          }}
          testID={testID}
          sx={{
            flexDirection: "row",
            flexWrap: isMobile ? "nowrap" : "wrap",
            overflow: "hidden",
            alignItems: "center",
            bg: "background",
            borderRadius: isMobile ? 0 : "default",
            ...sx
          }}
        >
          {toolbarTools.map((tools, index) => {
            return (
              <ControllerToolbarGroup
                key={tools.join("")}
                tools={tools}
                editor={editor}
                groupId={tools.join("")}
                sx={
                  index === toolbarTools.length - 1
                    ? undefined
                    : { borderRight: "1px solid", borderRightColor: "separator" }
                }
              />
            );
          })}
        </Flex>
      )}
      {props.floatingMenus}
      <PopupHost />
    </>
  );
}
