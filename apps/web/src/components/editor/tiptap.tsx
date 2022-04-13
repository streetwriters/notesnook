import { EditorContent, HTMLContent } from "@tiptap/react";
import { Toolbar, useTiptap } from "notesnook-editor";
import { Box } from "rebass";
import { useStore as useThemeStore } from "../../stores/theme-store";

export type CharacterCounter = {
  words: () => number;
  characters: () => number;
};

export interface IEditor {
  focus: () => void;
  setContent: (content: HTMLContent) => void;
  clearContent: () => void;
}

type TipTapProps = {
  onInit?: (editor: IEditor) => void;
  onDestroy?: () => void;
  onChange?: (content: string, counter?: CharacterCounter) => void;
  onFocus?: () => void;
};

function TipTap(props: TipTapProps) {
  const theme = useThemeStore((store) => store.theme);
  const accent = useThemeStore((store) => store.accent);

  const { onInit, onChange, onFocus, onDestroy } = props;
  let counter: CharacterCounter | undefined;
  const editor = useTiptap(
    {
      autofocus: "start",
      onFocus,
      onCreate: ({ editor }) => {
        counter = editor.storage.characterCount as CharacterCounter;
        if (onInit)
          onInit({
            focus: () => editor.commands.focus("start"),
            setContent: (content) => {
              editor.commands.clearContent(false);
              editor.commands.setContent(content, false);
              console.log("SETTING CONTENT", content);
            },
            clearContent: () => editor.commands.clearContent(false),
          });
      },
      onUpdate: ({ editor }) => {
        if (onChange) onChange(editor.getHTML(), counter);
      },
      onDestroy,
      injectCSS: false,
      theme,
      accent,
      scale: 1,
    },
    [theme, accent]
  );

  return (
    <Box>
      <Toolbar editor={editor} theme={theme} accent={accent} />
      <EditorContent
        style={{ flex: 1, cursor: "text" }}
        onClick={() => {
          editor?.commands.focus();
        }}
        editor={editor}
      />
    </Box>
  );
}
export default TipTap;
