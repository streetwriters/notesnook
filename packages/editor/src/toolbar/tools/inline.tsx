import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";
import { Flex } from "rebass";
import { Input } from "@rebass/forms";
import { Popup } from "../components/popup";

type InlineToolProps = ToolProps & {
  isToggled: (editor: Editor) => boolean;
  onClick: (editor: Editor) => boolean;
};
function InlineTool(props: InlineToolProps) {
  const { editor, title, icon, isToggled, onClick } = props;
  return (
    <ToolButton
      title={title}
      id={icon}
      icon={icon}
      onClick={() => onClick(editor)}
      toggled={isToggled(editor)}
    />
  );
}

export function Italic(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={(editor) => editor.isActive("italic")}
      onClick={(editor) => editor.chain().focus().toggleItalic().run()}
    />
  );
}

export function Strikethrough(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={(editor) => editor.isActive("strikethrough")}
      onClick={(editor) => editor.chain().focus().toggleStrike().run()}
    />
  );
}

export function Underline(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={(editor) => editor.isActive("underline")}
      onClick={(editor) => editor.chain().focus().toggleUnderline().run()}
    />
  );
}

export function Code(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={(editor) => editor.isActive("code")}
      onClick={(editor) => editor.chain().focus().toggleCode().run()}
    />
  );
}

export function Bold(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={(editor) => editor.isActive("bold")}
      onClick={(editor) => editor.chain().focus().toggleBold().run()}
    />
  );
}

export function Subscript(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={(editor) => editor.isActive("subscript")}
      onClick={(editor) => editor.chain().focus().toggleSubscript().run()}
    />
  );
}

export function Superscript(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={(editor) => editor.isActive("superscript")}
      onClick={(editor) => editor.chain().focus().toggleSuperscript().run()}
    />
  );
}

export function ClearFormatting(props: ToolProps) {
  return (
    <InlineTool
      {...props}
      isToggled={() => false}
      onClick={(editor) =>
        editor.chain().focus().clearNodes().unsetAllMarks().run()
      }
    />
  );
}

export function Link(props: ToolProps) {
  const { editor, title, icon } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const targetRef = useRef<HTMLElement>();
  const [isOpen, setIsOpen] = useState(false);
  const [href, setHref] = useState<string>();
  const [text, setText] = useState<string>();
  const currentUrl = editor.getAttributes("link").href;
  const isEditing = !!currentUrl;

  return (
    <>
      <ToolButton
        id={icon}
        ref={buttonRef}
        title={title}
        icon={icon}
        onClick={() => {
          if (isEditing) setHref(currentUrl);

          let { from, to, $from } = editor.state.selection;

          const selectedNode = $from.node();
          const pos = selectedNode.isTextblock ? $from.before() : $from.pos;

          const domNode = editor.view.nodeDOM(pos) as HTMLElement;
          targetRef.current = domNode;

          const selectedText = isEditing
            ? selectedNode.textContent
            : editor.state.doc.textBetween(from, to);

          setText(selectedText);
          setIsOpen(true);
        }}
        toggled={isOpen || !!isEditing}
      />
      <MenuPresenter
        options={{
          type: "menu",
          position: {
            target: targetRef.current || buttonRef.current || undefined,
            isTargetAbsolute: true,
            location: "below",
            yOffset: 5,
          },
        }}
        isOpen={isOpen}
        items={[]}
        onClose={() => {
          editor.commands.focus();
          setIsOpen(false);
        }}
      >
        <Popup
          title={isEditing ? "Edit link" : "Insert link"}
          action={{
            text: isEditing ? "Edit" : "Insert",
            onClick: () => {
              if (!href) return;

              let commandChain = editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href, target: "_blank" });
              if (text) commandChain = commandChain.insertContent(text).focus();

              commandChain.run();
              setIsOpen(false);
            },
          }}
          //  negativeButton={{ text: "Cancel", onClick: () => setIsOpen(false) }}
        >
          <Flex sx={{ p: 1, width: 300, flexDirection: "column" }}>
            <Input
              type="text"
              placeholder="Link text"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Input
              type="url"
              sx={{ mt: 1 }}
              autoFocus
              placeholder="https://example.com/"
              value={href}
              onChange={(e) => setHref(e.target.value)}
            />
          </Flex>
        </Popup>
      </MenuPresenter>
    </>
  );
}
