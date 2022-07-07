import { useTheme } from "@notesnook/theme";
import {
  Editor,
  PortalProvider,
  Toolbar,
  usePermissionHandler,
  useTiptap
} from "notesnook-editor";
import {
  useEffect,
  useLayoutEffect,
  useReducer,
  useRef,
  useState
} from "react";
import { useEditorController } from "../hooks/useEditorController";
import { useSettings } from "../hooks/useSettings";
import { useEditorThemeStore } from "../state/theme";
import { EventTypes, Settings } from "../utils";
import Header from "./header";
import StatusBar from "./statusbar";
import Tags from "./tags";
import Title from "./title";

const Tiptap = () => {
  const settings = useSettings();
  const [tick, setTick] = useState(0);
  const theme = useEditorThemeStore((state) => state.colors);
  const [initialProps, setInitialProps] = useState<Partial<Settings>>({
    readonly: global.readonly || settings.readonly,
    noHeader: global.noHeader || settings.noHeader,
    noToolbar:
      global.noToolbar ||
      settings.noToolbar ||
      global.readonly ||
      settings.readonly
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState(false);
  const toolbarTheme = useTheme({
    //todo
    accent: "green",
    scale: 1,
    theme: theme?.night ? "dark" : "light"
  });

  const editorTheme = useTheme({
    //todo
    accent: "green",
    scale: 1,
    theme: theme?.night ? "dark" : "light"
  });

  editorTheme.space = [0, 10, 12, 20];
  toolbarTheme.space = [0, 10, 12, 18];
  //@ts-ignore
  toolbarTheme.space.small = "10px";

  toolbarTheme.buttons.menuitem = {
    ...toolbarTheme.buttons.menuitem,
    height: "50px",
    paddingX: "20px",
    borderBottomWidth: 0
  };

  toolbarTheme.iconSizes = {
    big: 20,
    medium: 18,
    small: 18
  };
  toolbarTheme.fontSizes = {
    ...toolbarTheme.fontSizes,
    subBody: "0.8rem",
    body: "0.9rem"
  };

  toolbarTheme.radii = {
    ...toolbarTheme.radii,
    small: 5
  };

  toolbarTheme.buttons.menuitem = {
    ...toolbarTheme.buttons.menuitem,
    px: 5,
    height: "45px"
  };
  usePermissionHandler({
    claims: {
      premium: settings.premium
    },
    onPermissionDenied: () => {
      post(EventTypes.pro);
    }
  });
  const editor = useTiptap(
    {
      onUpdate: ({ editor }) => {
        global.editorController.contentChange(editor as Editor);
      },
      onSelectionUpdate: (props) => {
        global.editorController.selectionChange(props.editor as Editor);
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
      editable: !initialProps.readonly,
      editorProps: {
        editable: () => !initialProps.readonly
      },
      content: global.editorController?.content?.current,
      isMobile: true
    },
    [layout, initialProps.readonly, tick]
  );
  const controller = useEditorController(editor, setTick);
  const controllerRef = useRef(controller);
  globalThis.editorController = controller;
  globalThis.editor = editor;

  useEffect(() => {
    setInitialProps({ ...settings });
  }, [settings]);

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
          marginBottom: "5px"
        }}
      >
        <Header
          hasRedo={false}
          hasUndo={false}
          settings={settings}
          noHeader={initialProps.noHeader || false}
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
            display: "flex"
          }}
        >
          {initialProps.noHeader ? null : (
            <>
              <Tags />
              <Title
                readonly={settings.readonly}
                controller={controllerRef}
                title={controller.title}
              />
              <StatusBar container={containerRef} editor={editor} />
            </>
          )}
          <div
            ref={contentRef}
            style={{
              padding: 12,
              paddingTop: 0,
              color: theme?.pri,
              flex: 1
            }}
          />
        </div>

        {initialProps.noToolbar ? null : (
          <Toolbar
            sx={{ pl: "10px", pt: "5px", minHeight: 45 }}
            theme={toolbarTheme}
            editor={editor}
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
