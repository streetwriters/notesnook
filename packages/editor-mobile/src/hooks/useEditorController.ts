import { Editor } from "@streetwriters/editor";
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useEditorThemeStore } from "../state/theme";
import { EventTypes, isReactNative, post } from "../utils";

type Attachment = {
  hash: string;
  filename: string;
  type: string;
  size: number;
};

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
  openFilePicker: (type: "image" | "file" | "camera") => void;
  downloadAttachment: (attachment: Attachment) => void;
  content: MutableRefObject<string | null>;
  onUpdate: () => void;
  titlePlaceholder: string;
  setTitlePlaceholder: React.Dispatch<React.SetStateAction<string>>;
};

export function useEditorController(
  editor: Editor | null,
  update: () => void
): EditorController {
  const [title, setTitle] = useState("");
  const [titlePlaceholder, setTitlePlaceholder] = useState("Note title");
  const htmlContentRef = useRef<string | null>(null);
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

  const contentChange = useCallback((editor: Editor) => {
    if (!editor) return;
    if (typeof timers.current.change === "number") {
      clearTimeout(timers.current?.change);
    }
    timers.current.change = setTimeout(() => {
      htmlContentRef.current = editor.getHTML();
      post(EventTypes.content, htmlContentRef.current);
    }, 300);
  }, []);

  const scroll = useCallback(
    (event: React.UIEvent<HTMLDivElement, UIEvent>) => {
      //@ts-ignore
      //post(EventTypes.scroll, event.target.scrollTop);
    },
    []
  );

  const onUpdate = () => {
    update();
  };

  const onMessage = useCallback(
    (data: Event) => {
      console.log(data);

      //@ts-ignore
      if (data?.data[0] !== "{") return;
      //@ts-ignore
      let message = JSON.parse(data.data);
      let type = message.type;
      let value = message.value;
      global.sessionId = message.sessionId;
      switch (type) {
        case "native:html":
          htmlContentRef.current = value;
          update();
          break;
        case "native:theme":
          useEditorThemeStore.getState().setColors(message.value);
          break;
        case "native:title":
          setTitle(value);
          break;
        case "native:titleplaceholder":
          setTitlePlaceholder(value);
          break;
        case "native:status":
          break;
        default:
          break;
      }
      post(type); // Notify that message was delivered successfully.
    },
    [update]
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
    titlePlaceholder,
    setTitlePlaceholder,
    openFilePicker,
    downloadAttachment,
    content: htmlContentRef,
    onUpdate: onUpdate,
  };
}
