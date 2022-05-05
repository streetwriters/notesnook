import { useTheme } from "@notesnook/theme";
import { ThemeConfig } from "@notesnook/theme/dist/theme/types";
import { Editor } from "@tiptap/core";
import { Flex } from "rebass";
import { findToolById, ToolId } from "./tools";
import { ThemeProvider } from "emotion-theming";
import { EditorFloatingMenus } from "./floating-menus";

// type Colors = {
//   text: string;
//   background: string;
//   bgSecondary: string;
//   primary: string;
//   hover: string;
//   border: string;
// };

type ToolbarDefinition = ToolId[][];

type ToolbarProps = ThemeConfig & {
  editor: Editor | null;
  // tools: ToolbarDefinition;
  // colors: Colors;
};
export function Toolbar(props: ToolbarProps) {
  const { editor, theme, accent, scale } = props;
  const themeProperties = useTheme({ accent, theme, scale });

  const tools: ToolbarDefinition = [
    ["bold", "italic", "underline", "strikethrough", "code"],
    // ["fontSize", "fontFamily", "headings"],
    // ["alignLeft", "alignCenter", "alignRight", "alignJustify"],
    // ["subscript", "superscript", "horizontalRule"],
    // ["codeblock", "blockquote"],
    // ["formatClear", "ltr", "rtl"],
    // ["numberedList", "bulletList", "checklist"],
    // ["link", "image", "attachment", "table", "embed"],
    // ["textColor", "highlight"],
  ];

  if (!editor) return null;
  return (
    <ThemeProvider theme={themeProperties}>
      <Flex className="editor-toolbar" sx={{ flexWrap: "wrap" }}>
        {tools.map((tools) => {
          return (
            <Flex
              className="toolbar-group"
              sx={{
                pr: 2,
                mr: 2,
                borderRight: "1px solid var(--border)",
                ":last-of-type": { mr: 0, pr: 0, borderRight: "none" },
              }}
            >
              {tools.map((toolId) => {
                const Component = findToolById(toolId);
                return <Component editor={editor} id={toolId} />;
              })}
            </Flex>
          );
        })}
      </Flex>
      <EditorFloatingMenus editor={editor} />
    </ThemeProvider>
  );
}
