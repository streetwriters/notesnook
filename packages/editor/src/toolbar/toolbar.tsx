import { Theme } from "@notesnook/theme";
import { Editor } from "../types";
import { Flex, FlexProps } from "rebass";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";
import { getDefaultPresets, STATIC_TOOLBAR_GROUPS } from "./tool-definitions";
import { useEffect, useMemo } from "react";
import { ToolbarLocation, useToolbarStore } from "./stores/toolbar-store";
import { ToolbarDefinition } from "./types";
import { ToolbarGroup } from "./components/toolbar-group";
import {
  EditorContext,
  PopupRenderer,
} from "../components/popup-presenter/popuprenderer";

type ToolbarProps = FlexProps & {
  theme: Theme;
  editor: Editor | null;
  location: ToolbarLocation;
  tools?: ToolbarDefinition;
};

export function Toolbar(props: ToolbarProps) {
  const {
    editor,
    theme,
    location,
    tools = getDefaultPresets().default,
    sx,
    ...flexProps
  } = props;

  const toolbarTools = useMemo(
    () => [...STATIC_TOOLBAR_GROUPS, ...tools],
    [tools]
  );

  const setToolbarLocation = useToolbarStore(
    (store) => store.setToolbarLocation
  );

  useEffect(() => {
    setToolbarLocation(location);
  }, [location]);

  if (!editor) return null;
  return (
    <ThemeProvider theme={theme}>
      <EditorContext.Provider value={editor}>
        <PopupRenderer editor={editor}>
          <Flex
            className="editor-toolbar"
            sx={{
              ...sx,
              flexWrap: ["nowrap", "wrap"],
              overflowX: ["auto", "hidden"],
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
                    ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
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
