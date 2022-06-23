import { Editor } from "@tiptap/core";
import { Attachment } from "notesnook-editor/dist/extensions/attachment";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEditorThemeStore } from "../state/theme";
import { EventTypes, isReactNative, post, timerFn } from "../utils";

export type Selection = {
  [name: string]: {
    text?: string;
    length?: number;
    attributes?: Record<string, any>;
    type?: "mark" | "node";
  };
};

type Timers = {
  selectionChange: NodeJS.Timeout | null;
  change: NodeJS.Timeout | null;
};

export type EditorController = {
  selectionChange: (editor: Editor) => void;
  titleChange: (title: string) => void;
  contentChange: (editor: Editor) => void;
  scroll: (event: React.UIEvent<HTMLDivElement, UIEvent>) => void;
  title: string;
  setTitle: React.Dispatch<React.SetStateAction<string>>;
  openFilePicker: (type: "image" | "file") => void;
  downloadAttachment: (attachment: Attachment) => void;
};

export function useEditorController(editor: Editor | null): EditorController {
  const [title, setTitle] = useState("");

  const timers = useRef<Timers>({
    selectionChange: null,
    change: null,
  });

  const selectionChange = useCallback((editor: Editor) => {
    // if (!editor) return;
    // timers.current.selectionChange = timerFn(
    //   () => {
    //     let selection: Selection = {};
    //     let { view, state, schema } = editor;
    //     let { to, from } = view.state.selection;
    //     selection.attributes = {
    //       text: state.doc.textBetween(from, to, ""),
    //       length: to - from,
    //     };
    //     let marks = Object.keys(schema.marks);
    //     let nodes = Object.keys(schema.nodes);
    //     for (let mark of marks) {
    //       if (!editor.isActive(mark)) continue;
    //       selection[mark] = {
    //         attributes: editor.getAttributes(mark),
    //         type: "mark",
    //       };
    //     }
    //     for (let node of nodes) {
    //       if (!editor.isActive(node)) continue;
    //       selection[node] = {
    //         attributes: editor.getAttributes(node),
    //         type: "node",
    //       };
    //     }
    //     post(EventTypes.selection, selection);
    //   },
    //   500,
    //   timers.current?.selectionChange
    // );
  }, []);

  const titleChange = (title: string) => {
    post(EventTypes.title, title);
  };

  const contentChange = useCallback(
    (editor: Editor) => {
      if (!editor) return;
      selectionChange(editor);
      timers.current.change = timerFn(
        () => {
          post(EventTypes.content, editor.getHTML());
        },
        300,
        timers.current?.change
      );
    },
    [selectionChange]
  );

  const scroll = useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      //@ts-ignore
      post(EventTypes.scroll, event.target.scrollTop);
    },
    []
  );

  const onMessage = useCallback(
    (data: Event) => {
      //@ts-ignore
      let message = JSON.parse(data.data);
      let type = message.type;
      let value = message.value;
      global.sessionId = message.sessionId;
      switch (type) {
        case "native:html":
          editor?.commands.setContent(value, false, {
            preserveWhitespace: true,
          });
          break;
        case "native:theme":
          useEditorThemeStore.getState().setColors(message.value);
          break;
        case "native:title":
          setTitle(value);
          break;
        case "native:titleplaceholder":
          break;
        case "native:status":
          break;
        default:
          break;
      }
      post(type); // Notify that message was delivered successfully.
    },
    [editor]
  );

  // useEffect(() => {
  //   post(EventTypes.history, {
  //     undo: false, // editor?.can().undo(),
  //     redo: false, // editor?.can().redo(),
  //   });
  // }, [editor]);

  useEffect(() => {
    if (!isReactNative()) return; // Subscribe only in react native webview.
    let isSafari = navigator.vendor.match(/apple/i);
    let root = document;
    if (isSafari) {
      //@ts-ignore
      root = window;
    }

    root.addEventListener("message", onMessage);

    return () => {
      root.removeEventListener("message", onMessage);
    };
  }, [onMessage]);

  const openFilePicker = useCallback((type) => {
    post(EventTypes.filepicker, type);
  }, []);

  const downloadAttachment = useCallback((attachment: Attachment) => {
    alert("downloadAttachment" + attachment.hash);
    post(EventTypes.download, attachment);
  }, []);

  return {
    contentChange,
    selectionChange,
    titleChange,
    scroll,
    title,
    setTitle,
    openFilePicker,
    downloadAttachment,
  };
}
