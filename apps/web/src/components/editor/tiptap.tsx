import { Theme } from "@notesnook/theme";
import { useTheme } from "emotion-theming";
import {
  Toolbar,
  useTiptap,
  PortalProvider,
  PortalProviderAPI,
  PortalRenderer,
} from "notesnook-editor";
import { EditorContent, HTMLContent } from "@tiptap/react";
import { Flex } from "rebass";
import "notesnook-editor/dist/styles.css";
import React from "react";
import useMobile from "../../utils/use-mobile";

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

function TipTap(props: TipTapProps & { portalProviderAPI: PortalProviderAPI }) {
  const theme: Theme = useTheme();
  const isMobile = useMobile();

  const { onInit, onChange, onFocus, onDestroy, portalProviderAPI } = props;
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
      theme,
      portalProviderAPI,
      onOpenAttachmentPicker: (type) => {
        console.log(type);
        return false;
      },
    },
    [theme, portalProviderAPI]
  );

  return (
    <Flex sx={{ flex: 1, flexDirection: "column" }}>
      <EditorContent
        style={{ flex: 1, cursor: "text", color: theme.colors.text }}
        onClick={() => {
          editor?.commands.focus();
        }}
        editor={editor}
      />
      <Toolbar
        editor={editor}
        theme={theme}
        location={isMobile ? "bottom" : "top"}
        isMobile={isMobile || false}
      />
    </Flex>
  );
}

function TiptapProvider(props: TipTapProps) {
  console.log("Rerendering tiptap provider");
  return (
    <PortalProvider
      render={(portalProviderAPI) => (
        <>
          <TipTap {...props} portalProviderAPI={portalProviderAPI} />
          <PortalRenderer portalProviderAPI={portalProviderAPI} />
        </>
      )}
    />
  );
}
export default React.memo(TiptapProvider);
