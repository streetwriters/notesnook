import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useCallback, useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { Popup } from "../components/popup";
import { LinkPopup } from "../popups/link-popup";
import { useToolbarLocation } from "../stores/toolbar-store";
import { MoreTools } from "../components/more-tools";
import { useRefValue } from "../../hooks/use-ref-value";
import { findMark, selectionToOffset } from "../utils/prosemirror";
import { setTextSelection } from "prosemirror-utils";
import { Flex, Text } from "rebass";

export function LinkSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("link") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="linkSettings"
      tools={["openLink", "editLink", "removeLink"]}
    />
  );
}

export function AddLink(props: ToolProps) {
  const { editor } = props;

  const isActive = props.editor.isActive("link");

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
  }, []);

  if (isActive) return <EditLink {...props} />;
  return (
    <LinkTool
      {...props}
      onDone={onDone}
      onClick={() => {
        let { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        return { text: selectedText };
      }}
    />
  );
}

export function EditLink(props: ToolProps) {
  const { editor, selectedNode: _selectedNode } = props;
  const selectedNode = useRefValue(
    _selectedNode || selectionToOffset(editor.state.selection)
  );

  const onDone = useCallback((href: string, text: string) => {
    if (!href || !editor.current) return;

    const { from, node, to } = selectedNode.current;
    const mark = findMark(node, "link");
    if (!mark) return;

    editor.current
      .chain()
      .command(({ tr }) => {
        tr.removeMark(from, to, mark.type);
        tr.addMark(from, to, mark.type.create({ href }));
        tr.insertText(text || node.textContent, from, to);
        setTextSelection(tr.mapping.map(from))(tr);
        return true;
      })
      .focus(undefined, { scrollIntoView: true })
      .run();
  }, []);

  return (
    <LinkTool
      {...props}
      isEditing
      onDone={onDone}
      onClick={() => {
        const { node } = selectedNode.current;
        const selectedText = node.textContent;
        const mark = findMark(node, "link");

        if (!mark) return;
        return { text: selectedText, href: mark.attrs.href };
      }}
    />
  );
}

export function RemoveLink(props: ToolProps) {
  const { editor, selectedNode } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        if (selectedNode) editor.commands.setTextSelection(selectedNode.from);
        editor.current?.chain().focus().unsetLink().run();
      }}
    />
  );
}

export function OpenLink(props: ToolProps) {
  const { editor, selectedNode } = props;
  const node = selectedNode?.node || editor.state.selection.$anchor.node();
  const link = selectedNode ? findMark(node, "link") : null;
  if (!link) return null;
  const href = link?.attrs.href;

  return (
    <Flex sx={{ alignItems: "center" }}>
      <Text as="a" href={href} target="_blank" variant="body" sx={{ mr: 1 }}>
        {href}
      </Text>
      <ToolButton
        {...props}
        toggled={false}
        onClick={() => window.open(href, "_blank")}
      />
    </Flex>
  );
}

type LinkToolProps = ToolProps & {
  isEditing?: boolean;
  onDone: (href: string, text: string) => void;
  onClick: () => { href?: string; text: string } | undefined;
};
function LinkTool(props: LinkToolProps) {
  const { isEditing, onClick, onDone } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [href, setHref] = useState<string>();
  const [text, setText] = useState<string>();

  return (
    <>
      <ToolButton
        {...props}
        buttonRef={buttonRef}
        onClick={() => {
          const result = onClick();
          if (!result) return;
          const { text, href } = result;
          setHref(href);
          setText(text);
          setIsOpen(true);
        }}
        toggled={isOpen}
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
        <LinkPopup
          href={href}
          text={text}
          isEditing={isEditing}
          onClose={() => setIsOpen(false)}
          onDone={({ href, text }) => {
            onDone(href, text);
            setIsOpen(false);
          }}
        />
      </ResponsivePresenter>
    </>
  );
}
