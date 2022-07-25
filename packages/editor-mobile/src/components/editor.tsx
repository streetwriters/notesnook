import {
  Editor,
  PortalProvider,
  Toolbar,
  usePermissionHandler,
  useTiptap,
} from "@streetwriters/editor";
import { useTheme } from "@streetwriters/theme";
import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useEditorController } from "../hooks/useEditorController";
import { useSettings } from "../hooks/useSettings";
import { useEditorThemeStore } from "../state/theme";
import { EventTypes } from "../utils";
import Header from "./header";
import StatusBar from "./statusbar";
import Tags from "./tags";
import Title from "./title";

const Tiptap = () => {
  const settings = useSettings();
  const [tick, setTick] = useState(0);
  const theme = useEditorThemeStore((state) => state.colors);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(false);
  const toolbarTheme = useTheme({
    //todo
    accent: theme?.accent,
    scale: 1,
    theme: theme?.night ? "dark" : "light",
  });

  const editorTheme = useTheme({
    //todo
    accent: theme?.accent,
    scale: 1,
    theme: theme?.night ? "dark" : "light",
  });

  editorTheme.colors.background = theme?.bg || "#f0f0f0";

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
  usePermissionHandler({
    claims: {
      premium: settings.premium,
    },
    onPermissionDenied: () => {
      post(EventTypes.pro);
    },
  });
  const _editor = useTiptap(
    {
      onUpdate: ({ editor }) => {
        global.editorController.contentChange(editor as Editor);
      },
      onSelectionUpdate: (props) => {
        props.transaction.scrollIntoView();
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
      editable: !settings.readonly,
      editorProps: {
        editable: () => !settings.readonly,
      },
      content: global.editorController?.content?.current,
      isMobile: true,
      isKeyboardOpen: settings.keyboardShown,
    },
    [layout, settings.readonly, tick]
  );

  const update = useCallback(() => {
    setTick((tick) => tick + 1);
    globalThis.editorController.setTitlePlaceholder("Note title");
  }, []);

  const controller = useEditorController(update);
  const controllerRef = useRef(controller);
  globalThis.editorController = controller;
  globalThis.editor = _editor;

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
        <Header
          hasRedo={_editor?.can().redo() || false}
          hasUndo={_editor?.can().undo() || false}
          settings={settings}
          noHeader={settings.noHeader || false}
        />
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
          {settings.noHeader ? null : (
            <>
              <Tags />
              <Title
                titlePlaceholder={controller.titlePlaceholder}
                readonly={settings.readonly}
                controller={controllerRef}
                title={controller.title}
              />
              <StatusBar container={containerRef} editor={_editor} />
            </>
          )}
          <div
            ref={contentRef}
            style={{
              padding: 12,
              paddingTop: 0,
              color: theme?.pri,
              flex: 1,
            }}
          />
          <div
            onDoubleClick={() => {
              const lastPosition = globalThis.editor?.state.doc.content.size;
              if (!lastPosition) return;
              globalThis.editor
                ?.chain()
                .focus()
                .insertContentAt(lastPosition - 1, "<p></p>", {
                  updateSelection: true,
                })
                .run();
            }}
            style={{ flexShrink: 0, height: 150, width: "100%" }}
          />
        </div>

        {settings.noToolbar || !layout ? null : (
          <Toolbar
            sx={{ pl: "10px", pt: "5px", minHeight: 45 }}
            theme={toolbarTheme}
            editor={_editor}
            location="bottom"
            tools={[...settings.tools]}
          />
        )}
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
