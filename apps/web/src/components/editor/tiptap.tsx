import { EditorContent, HTMLContent } from "@tiptap/react";
import { useTiptap } from "notesnook-editor";
import { useEffect } from "react";

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
  const { onInit, onChange, onFocus, onDestroy } = props;
  let counter: CharacterCounter | undefined;
  const editor = useTiptap(
    {
      autofocus: "start",
      onFocus,
      onCreate: ({ editor }) => {
        console.log("CREATING NEW EDITOR");
        counter = editor.storage.characterCount as CharacterCounter;
        if (onInit)
          onInit({
            focus: () => editor.commands.focus("start"),
            setContent: (content) => {
              editor.commands.clearContent(false);
              editor.commands.setContent(content, false);
            },
            clearContent: () => editor.commands.clearContent(false),
          });
      },
      onUpdate: ({ editor }) => {
        if (onChange) onChange(editor.getHTML(), counter);
      },
      onDestroy,
    },
    []
  );

  return (
    <EditorContent
      style={{ flex: 1, cursor: "text" }}
      onClick={() => {
        editor?.commands.focus();
      }}
      editor={editor}
    />
  );
}
export default TipTap;
