import { ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { useCallback, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { Button, Flex } from "rebass";
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

  const onDone = useCallback((href: string, text: string) => {
    if (!href) return;

    let commandChain = editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href, target: "_blank" });
    if (text) commandChain = commandChain.insertContent(text).focus();

    commandChain.run();
    setIsOpen(false);
  }, []);

  return (
    <>
      <ToolButton
        id={icon}
        buttonRef={buttonRef}
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
      <ResponsivePresenter
        mobile="sheet"
        desktop="menu"
        position={{
          target: targetRef.current || buttonRef.current || undefined,
          isTargetAbsolute: true,
          location: "below",
          align: "center",
          yOffset: 5,
        }}
        title={isEditing ? "Edit link" : "Insert link"}
        isOpen={isOpen}
        items={[]}
        onClose={() => {
          editor.commands.focus();
          setIsOpen(false);
        }}
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

type LinkPopupProps = {
  text?: string;
  href?: string;
  isEditing?: boolean;
  onDone: (link: { text: string; href: string }) => void;
};
function LinkPopup(props: LinkPopupProps) {
  const { text: _text, href: _href, isEditing = false, onDone } = props;
  const [href, setHref] = useState<string>(_href || "");
  const [text, setText] = useState<string>(_text || "");

  return (
    <Flex sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}>
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
      <Button
        variant={"primary"}
        sx={{
          alignSelf: ["stretch", "end", "end"],
          my: 1,
          mr: 1,
        }}
        onClick={() => onDone({ text, href })}
      >
        {isEditing ? "Save edits" : "Insert link"}
      </Button>
    </Flex>
  );
}
