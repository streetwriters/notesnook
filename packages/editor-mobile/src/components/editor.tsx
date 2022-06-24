import { useTheme } from "@notesnook/theme";
import { EditorContent } from "@tiptap/react";
import { PortalProvider, Toolbar, useTiptap } from "notesnook-editor";
import { useEditorController } from "../hooks/useEditorController";
import { useEditorThemeStore } from "../state/theme";
import Header from "./header";
import StatusBar from "./statusbar";
import Tags from "./tags";
import Title from "./title";

const Tiptap = () => {
  const theme = useEditorThemeStore((state) => state.colors);
  const toolbarTheme = useTheme({
    //todo
    accent: "green",
    scale: 1,
    theme: theme?.night ? "dark" : "light",
  });

  const editorTheme = useTheme({
    //todo
    accent: "green",
    scale: 1,
    theme: theme?.night ? "dark" : "light",
  });

  editorTheme.space = [0, 6, 12, 20];
  toolbarTheme.space = [0, 10, 12, 18];
  //@ts-ignore
  toolbarTheme.space.small = "10px";

  toolbarTheme.buttons.menuitem = {
    ...toolbarTheme.buttons.menuitem,
    height: "50px",
    paddingX: "20px",
    borderBottomWidth: 0,
  };

  toolbarTheme.iconSizes = {
    big: 20,
    medium: 18,
    small: 18,
  };
  toolbarTheme.fontSizes = {
    ...toolbarTheme.fontSizes,
    subBody: "0.8rem",
    body: "0.8rem",
  };

  toolbarTheme.radii = {
    ...toolbarTheme.radii,
    small: 5,
  };

  toolbarTheme.buttons.menuitem = {
    ...toolbarTheme.buttons.menuitem,
    px: 5,
    height: "45px",
  };

  const editor = useTiptap({
    onUpdate: ({ editor }) => {
      global.editorController.contentChange(editor);
    },
    onSelectionUpdate: (props) => {
      global.editorController.selectionChange(props.editor);
    },
    onOpenAttachmentPicker: (editor, type) => {
      global.editorController.openFilePicker(type);
      return true;
    },
    onDownloadAttachment: (editor, attachment) => {
      global.editorController.downloadAttachment(attachment);
      return true;
    },
    theme: editorTheme,
  });
  const controller = useEditorController(editor);
  globalThis.editorController = controller;

  return (
    <>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          maxWidth: "100vw",
          marginBottom: "5px",
        }}
      >
        <Header controller={controller} />
        <div
          onScroll={controller.scroll}
          style={{
            overflowY: "scroll",
            flexDirection: "column",
            height: "100%",
            flexGrow: 1,
            flexShrink: 1,
            display: "flex",
          }}
        >
          <Tags controller={controller} />
          <Title controller={controller} />
          <StatusBar editor={editor} />
          <EditorContent
            style={{
              padding: 12,
              paddingTop: 0,
              color: theme?.pri,
            }}
            editor={editor}
          />
        </div>

        <div
          style={{
            paddingLeft: 10,
            paddingTop: 5,
          }}
        >
          <Toolbar
            isMobile={true}
            theme={toolbarTheme}
            editor={editor}
            location="bottom"
          />
        </div>
      </div>
    </>
  );
};

const TiptapProvider = () => {
  return (
    <PortalProvider>
      <Tiptap />
    </PortalProvider>
  );
};

export default TiptapProvider;
