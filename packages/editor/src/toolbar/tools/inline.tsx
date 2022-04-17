import { ITool, ToolProps } from "../types";
import { Editor } from "@tiptap/core";
import { ToolButton } from "../components/tool-button";
import { ToolId } from ".";
import { MenuPresenter } from "../../components/menu/menu";
import { useRef, useState } from "react";
import { Flex, Text } from "rebass";
import { Input } from "@rebass/forms";
import { Popup } from "../components/popup";
import { FloatingMenu } from "@tiptap/react";
import { IconNames } from "../icons";

class InlineTool<TId extends ToolId> implements ITool {
  constructor(
    readonly id: TId,
    readonly title: string,
    private readonly icon: IconNames
  ) {}

  render = (props: ToolProps) => {
    const { editor } = props;
    return (
      <ToolButton
        title={this.title}
        id={this.id}
        icon={this.icon}
        onClick={() => editor.chain().focus().toggleMark(this.id).run()}
        toggled={editor.isActive(this.id)}
      />
    );
  };
}

export class Italic extends InlineTool<ToolId> {
  constructor() {
    super("italic", "Italic", "italic");
  }
}

export class Strikethrough extends InlineTool<ToolId> {
  constructor() {
    super("strikethrough", "Strikethrough", "strikethrough");
  }
}

export class Underline extends InlineTool<ToolId> {
  constructor() {
    super("underline", "Underline", "underline");
  }
}

export class Code extends InlineTool<ToolId> {
  constructor() {
    super("code", "Code", "code");
  }
}

export class Bold extends InlineTool<ToolId> {
  constructor() {
    super("bold", "Bold", "bold");
  }
}

export class Subscript extends InlineTool<ToolId> {
  constructor() {
    super("subscript", "Subscript", "subscript");
  }
}

export class Superscript extends InlineTool<ToolId> {
  constructor() {
    super("superscript", "Superscript", "superscript");
  }
}

export class ClearFormatting implements ITool {
  id: ToolId = "formatClear";
  title = "Clear all formatting";

  render = (props: ToolProps) => {
    const { editor } = props;

    return (
      <ToolButton
        title={this.title}
        id={this.id}
        icon="formatClear"
        onClick={() =>
          editor.chain().focus().clearNodes().unsetAllMarks().run()
        }
        toggled={false}
      />
    );
  };
}

export class Link implements ITool {
  id: ToolId = "link";
  title = "Link";

  render = (props: ToolProps) => {
    const { editor } = props;
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
          ref={buttonRef}
          title={this.title}
          id={this.id}
          icon={"link"}
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
                if (text)
                  commandChain = commandChain.insertContent(text).focus();

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
  };
}
