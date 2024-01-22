/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2023 Streetwriters (Private) Limited

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive";
import { LinkPopup } from "../popups/link-popup";
import { useToolbarLocation } from "../stores/toolbar-store";
import { MoreTools } from "../components/more-tools";
import { useRefValue } from "../../hooks/use-ref-value";
import { findMark, selectionToOffset } from "../../utils/prosemirror";
import { Flex, Link } from "@theme-ui/components";
import { ImageNode } from "../../extensions/image";
import { Link as LinkNode } from "../../extensions/link";
import { getMarkAttributes } from "@tiptap/core";

export function LinkSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("link") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoOpen
      autoCloseOnUnmount
      popupId="linkSettings"
      tools={
        editor.isEditable
          ? ["openLink", "editLink", "removeLink", "copyLink"]
          : ["openLink", "copyLink"]
      }
    />
  );
}

export function AddLink(props: ToolProps) {
  const { editor } = props;

  const isActive = editor.isActive("link");

  if (isActive) return <EditLink {...props} icon={"linkEdit"} />;
  return (
    <LinkTool
      {...props}
      onDone={(attributes) => editor.commands.toggleLink(attributes)}
      onClick={() => {
        if (!editor) return;
        const selectedText = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        );
        return { title: selectedText, href: "" };
      }}
    />
  );
}

export function AddInternalLink(props: ToolProps) {
  const { editor } = props;
  const isActive = editor.isActive(LinkNode.name);

  if (isActive) return null;
  return (
    <ToolButton
      {...props}
      onClick={async () => {
        const link = await editor.storage.createInternalLink?.();
        if (!link) return;

        const selectedText = editor.state.doc.textBetween(
          editor.state.selection.from,
          editor.state.selection.to
        );
        editor.commands.setLink({ ...link, title: selectedText || link.title });
      }}
    />
  );
}

export function EditLink(props: ToolProps) {
  const { editor, selectedNode: _selectedNode } = props;
  const selectedNode = useRefValue(
    _selectedNode || selectionToOffset(editor.state)
  );
  const { node } = _selectedNode || {};
  const link = node ? findMark(node, LinkNode.name) : null;
  const attrs = link?.attrs || getMarkAttributes(editor.state, LinkNode.name);

  if (attrs && isInternalLink(attrs.href))
    return (
      <ToolButton
        {...props}
        onClick={async () => {
          const link = await editor.storage.createInternalLink?.();
          if (!link) return;
          const { from, to } = editor.state.selection;
          if (selectedNode.current)
            editor.commands.setTextSelection(selectedNode.current);
          editor.commands.setLink(link);
          if (selectedNode.current)
            editor.commands.setTextSelection({ from, to });
        }}
      />
    );

  return (
    <LinkTool
      {...props}
      isEditing
      onDone={(attributes) => editor.commands.setLink(attributes)}
      onClick={() => {
        if (!selectedNode.current) return;

        const { node } = selectedNode.current;
        if (!node) return;

        const selectedText = node.textContent;
        const mark = findMark(node, "link");

        if (!mark) return;
        return {
          title: selectedText,
          href: mark.attrs.href
        };
      }}
    />
  );
}

export function RemoveLink(props: ToolProps) {
  const { editor, selectedNode } = props;
  if (!editor.isEditable) return null;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        if (selectedNode)
          editor.commands.setTextSelection({
            from: selectedNode.from,
            to: selectedNode.to
          });
        editor.chain().focus().unsetLink().run();
      }}
    />
  );
}

export function OpenLink(props: ToolProps) {
  const { editor, selectedNode: _selectedNode } = props;
  const selectedNode = useRefValue(
    _selectedNode || selectionToOffset(editor.state)
  );
  const { node } = selectedNode.current || {};
  const link = node ? findMark(node, "link") : null;
  if (!link) return null;
  const href = link?.attrs.href;

  return (
    <Flex sx={{ alignItems: "center" }}>
      <Link
        href={href}
        onClick={(e) => {
          e.preventDefault();
          editor.storage.openLink?.(href);
        }}
        target="_blank"
        variant="body"
        sx={{
          fontSize: "subBody",
          fontFamily: "body",
          mr: 1,
          color: "accent",
          maxWidth: [150, 250],
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          ":visited": { color: "accent" },
          ":hover": { color: "accent", opacity: 0.8 }
        }}
      >
        {href}
      </Link>
      <ToolButton
        {...props}
        toggled={false}
        onClick={() => {
          editor.storage.openLink?.(href);
        }}
      />
    </Flex>
  );
}

export function CopyLink(props: ToolProps) {
  const { editor, selectedNode: _selectedNode } = props;
  const selectedNode = useRefValue(
    _selectedNode || selectionToOffset(editor.state)
  );
  const { node } = selectedNode.current || {};
  const link = node ? findMark(node, "link") : null;
  if (!link) return null;
  const href = link?.attrs.href;

  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        editor.storage.copyToClipboard?.(
          href,
          `<a href="${href}">${
            selectedNode.current?.node?.textContent || link?.attrs.title
          }</a>`
        );
      }}
    />
  );
}

export type LinkDefinition = {
  href: string;
  title?: string;
};
type LinkToolProps = ToolProps & {
  isEditing?: boolean;
  onDone: (link: LinkDefinition) => void;
  onClick: () => LinkDefinition | undefined;
};
function LinkTool(props: LinkToolProps) {
  const { isEditing, onClick, onDone, editor, ...toolProps } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [linkDefinition, setLinkDefinition] = useState<LinkDefinition>();
  const isImageActive = editor.isActive(ImageNode.name);

  return (
    <>
      <ToolButton
        {...toolProps}
        buttonRef={buttonRef}
        onClick={() => {
          const result = onClick();
          if (!result) return;
          setLinkDefinition(result);
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
          yOffset: 5
        }}
        title={isEditing ? "Edit link" : "Insert link"}
        isOpen={isOpen}
        items={[]}
        onClose={() => {
          setIsOpen(false);
          editor.commands.focus();
        }}
        focusOnRender={false}
      >
        <LinkPopup
          link={linkDefinition}
          isEditing={isEditing}
          isImageActive={isImageActive}
          onClose={() => setIsOpen(false)}
          onDone={(link) => {
            onDone(link);
            setIsOpen(false);
          }}
        />
      </ResponsivePresenter>
    </>
  );
}

function isInternalLink(href: string) {
  return href.startsWith("nn://");
}
