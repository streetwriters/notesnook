import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useCallback, useMemo, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { Popup } from "../components/popup";
import { LinkPopup } from "../popups/link-popup";
import { useToolbarLocation } from "../stores/toolbar-store";

export function Italic(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("italic")}
      onClick={() => editor.current?.chain().focus().toggleItalic().run()}
    />
  );
}

export function Strikethrough(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("strike")}
      onClick={() => editor.current?.chain().focus().toggleStrike().run()}
    />
  );
}

export function Underline(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("underline")}
      onClick={() => editor.current?.chain().focus().toggleUnderline().run()}
    />
  );
}

export function Code(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("code")}
      onClick={() => editor.current?.chain().focus().toggleCode().run()}
    />
  );
}

export function Bold(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("bold")}
      onClick={() => editor.current?.chain().focus().toggleBold().run()}
    />
  );
}

export function Subscript(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("subscript")}
      onClick={() => editor.current?.chain().focus().toggleSubscript().run()}
    />
  );
}

export function Superscript(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={editor.isActive("superscript")}
      onClick={() => editor.current?.chain().focus().toggleSuperscript().run()}
    />
  );
}

export function ClearFormatting(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .clearNodes()
          .unsetAllMarks()
          .unsetMark("link")
          .run()
      }
    />
  );
}

export function LinkRemove(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("link") || !isBottom) return null;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => editor.current?.chain().focus().unsetMark("link").run()}
    />
  );
}

export function CodeRemove(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("code") || !isBottom) return null;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => editor.current?.chain().focus().unsetMark("code").run()}
    />
  );
}

export function Link(props: ToolProps) {
  const { editor, title, icon } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [href, setHref] = useState<string>();
  const [text, setText] = useState<string>();
  const currentUrl = editor.getAttributes("link").href;
  const isEditing = !!currentUrl;

  const onDone = useCallback((href: string, text: string) => {
    if (!href) return;

    let commandChain = editor.current?.chain().focus();
    if (!commandChain) return;

    commandChain
      .extendMarkRange("link")
      .toggleLink({ href, target: "_blank" })
      .insertContent(text || href)
      .focus()
      .unsetMark("link")
      .insertContent(" ")
      .run();

    setIsOpen(false);
  }, []);

  return (
    <>
      <ToolButton
        id={icon}
        buttonRef={buttonRef}
        title={title}
        icon={isEditing ? "linkEdit" : icon}
        onClick={() => {
          if (isEditing) setHref(currentUrl);

          let { from, to, $from } = editor.state.selection;
          const selectedNode = $from.node();

          const selectedText = isEditing
            ? selectedNode.textContent
            : editor.state.doc.textBetween(from, to);

          setText(selectedText);
          setIsOpen(true);
        }}
        toggled={isOpen || !!isEditing}
      />
      <ResponsivePresenter
        mobile="sheet"
        desktop="menu"
        position={{
          target: buttonRef.current || undefined,
          isTargetAbsolute: true,
          location: "below",
          align: "center",
          yOffset: 5,
        }}
        title={isEditing ? "Edit link" : "Insert link"}
        isOpen={isOpen}
        items={[]}
        onClose={() => setIsOpen(false)}
        focusOnRender={false}
      >
        <Popup
          title={isEditing ? "Edit link" : "Insert link"}
          onClose={() => setIsOpen(false)}
        >
          <LinkPopup
            href={href}
            text={text}
            isEditing={isEditing}
            onDone={({ href, text }) => {
              onDone(href, text);
            }}
          />
        </Popup>
      </ResponsivePresenter>
    </>
  );
}

// export function Link(props: ToolProps) {
//   const { editor, title, icon } = props;
//   const buttonRef = useRef<HTMLButtonElement>(null);
//   const [isOpen, setIsOpen] = useState(false);

//   const [href, setHref] = useState<string>();
//   const [text, setText] = useState<string>();
//   const currentUrl = editor.getAttributes("link").href;
//   const isEditing = !!currentUrl;

//   const onDone = useCallback((href: string, text: string) => {
//     if (!href) return;

//     let commandChain = editor.current?.chain().focus();
//     if (!commandChain) return;

//     commandChain
//       .extendMarkRange("link")
//       .toggleLink({ href, target: "_blank" })
//       .insertContent(text || href)
//       .focus()
//       .unsetMark("link")
//       .insertContent(" ")
//       .run();

//     setIsOpen(false);
//   }, []);

//   return (
//     <>
//       <ToolButton
//         id={icon}
//         buttonRef={buttonRef}
//         title={title}
//         icon={icon}
//         onClick={() => {
//           if (isEditing) setHref(currentUrl);

//           let { from, to, $from } = editor.state.selection;
//           const selectedNode = $from.node();

//           const selectedText = isEditing
//             ? selectedNode.textContent
//             : editor.state.doc.textBetween(from, to);

//           setText(selectedText);
//           setIsOpen(true);
//         }}
//         toggled={isOpen || !!isEditing}
//       />
//     </>
//   );
// }
