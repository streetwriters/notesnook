import { useTheme } from "@notesnook/theme";
import { PortalProvider, Toolbar, useTiptap } from "notesnook-editor";
import { useLayoutEffect, useRef, useState } from "react";
import { useEditorController } from "../hooks/useEditorController";
import { useSettings } from "../hooks/useSettings";
import { useEditorThemeStore } from "../state/theme";
import Header from "./header";
import StatusBar from "./statusbar";
import Tags from "./tags";
import Title from "./title";

const Tiptap = () => {
  const settings = useSettings();
  const theme = useEditorThemeStore((state) => state.colors);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(false);
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

  editorTheme.space = [0, 10, 12, 20];
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
    body: "0.9rem",
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

  const editor = useTiptap(
    {
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
      element: !layout ? undefined : contentRef.current || undefined,
    },
    [layout]
  );
  const controller = useEditorController(editor);
  const controllerRef = useRef(controller);
  globalThis.editorController = controller;
  globalThis.editor = editor;

  useLayoutEffect(() => {
    setLayout(true);
  }, []);

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
        <Header />
        <div
          onScroll={controller.scroll}
          ref={containerRef}
          style={{
            overflowY: "scroll",
            flexDirection: "column",
            height: "100%",
            flexGrow: 1,
            flexShrink: 1,
            display: "flex",
          }}
        >
          <Tags />
          <Title controller={controllerRef} title={controller.title} />
          <StatusBar container={containerRef} editor={editor} />
          <div
            ref={contentRef}
            style={{
              padding: 12,
              paddingTop: 0,
              color: theme?.pri,
              flex: 1,
            }}
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
            tools={settings.tools}
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
