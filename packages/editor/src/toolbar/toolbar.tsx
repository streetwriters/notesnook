import { Theme, useTheme } from "@notesnook/theme";
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { Editor } from "@tiptap/core";
import { Flex, FlexProps } from "rebass";
import { findTool, ToolId } from "./tools";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";
import { getToolDefinition } from "./tool-definitions";
import { Dropdown } from "./components/dropdown";
import { ToolButton } from "./components/tool-button";
import { useContext, useEffect, useRef, useState } from "react";
// import { MenuPresenter } from "../components/menu";
import { Popup } from "./components/popup";
import {
  ToolbarLocation,
  useToolbarLocation,
  useToolbarStore,
} from "./stores/toolbar-store";
import { getToolbarElement } from "./utils/dom";
import { ToolbarDefinition, ToolProps } from "./types";
import { ToolbarGroup } from "./components/toolbar-group";
import {
  EditorContext,
  PopupRenderer,
} from "../components/popup-presenter/popuprenderer";
// type Colors = {
//   text: string;
//   background: string;
//   bgSecondary: string;
//   primary: string;
//   hover: string;
//   border: string;
// };

type ToolbarProps = {
  theme: Theme;
  editor: Editor | null;
  location: ToolbarLocation;
  isMobile?: boolean;
};
export function Toolbar(props: ToolbarProps) {
  const { editor, theme, location, isMobile } = props;
  const setIsMobile = useToolbarStore((store) => store.setIsMobile);
  const setToolbarLocation = useToolbarStore(
    (store) => store.setToolbarLocation
  );

  useEffect(() => {
    setIsMobile(isMobile || false);
    setToolbarLocation(location);
  }, [isMobile, location]);

  const tools: ToolbarDefinition = [
    [
      "insertBlock",
      "tableSettings",
      "imageSettings",
      "embedSettings",
      "attachmentSettings",
      "linkRemove",
      "codeRemove",
    ],
    [
      "bold",
      "italic",
      "underline",
      [
        "strikethrough",
        "code",
        "subscript",
        "superscript",
        "highlight",
        "textColor",
      ],
    ],
    ["fontSize"],
    ["headings", "fontFamily"],
    ["numberedList", "bulletList"],
    ["link"],
    ["alignCenter", ["alignLeft", "alignRight", "alignJustify", "ltr", "rtl"]],
    ["clearformatting"],
  ];

  if (!editor) return null;
  return (
    <ThemeProvider theme={theme}>
      <EditorContext.Provider value={editor}>
        <PopupRenderer editor={editor}>
          <Flex
            className="editor-toolbar"
            sx={{ flexWrap: ["nowrap", "wrap"], overflowX: ["auto", "hidden"] }}
          >
            {tools.map((tools) => {
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
