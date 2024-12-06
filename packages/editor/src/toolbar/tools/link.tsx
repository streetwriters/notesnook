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

import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { useRef, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { LinkPopup } from "../popups/link-popup.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { MoreTools } from "../components/more-tools.js";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { findMark, selectionToOffset } from "../../utils/prosemirror.js";
import { Flex, Link } from "@theme-ui/components";
import { ImageNode } from "../../extensions/image/index.js";
import { Link as LinkNode } from "../../extensions/link/index.js";
import { getMarkAttributes } from "@tiptap/core";
import { useHoverPopupContext } from "../floating-menus/hover-popup/context.js";
import { strings } from "@notesnook/intl";

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

  return (
    <ToolButton
      {...props}
      disabled={isActive}
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
  const { editor } = props;
  const { selectedNode: _selectedNode, hide } = useHoverPopupContext();
  const selectedNode = useRefValue(
    _selectedNode || selectionToOffset(editor.state)
  );
  const { node } = _selectedNode || {};
  const link = node ? findMark(node, LinkNode.name) : null;
  const attrs = link?.attrs || getMarkAttributes(editor.state, LinkNode.name);

  if (!editor.isEditable) return null;
  if (attrs && isInternalLink(attrs.href))
    return (
      <ToolButton
        {...props}
        onClick={async () => {
          hide();
          const link = await editor.storage.createInternalLink?.();
          if (!link) return;
          const { from, to } = editor.state.selection;
          if (selectedNode.current)
            editor.commands.setTextSelection(selectedNode.current);

          const selectedText =
            !!selectedNode.current &&
            editor.state.doc.textBetween(
              selectedNode.current.from,
              selectedNode.current.to
            );
          editor.commands.setLink({
            ...link,
            title: selectedText || link.title
          });
          if (selectedNode.current)
            editor.commands.setTextSelection({ from, to });
        }}
      />
    );

  return (
    <LinkTool
      {...props}
      isEditing
      onDone={(attributes) => {
        if (selectedNode.current)
          editor.chain().focus().setTextSelection(selectedNode.current).run();
        editor.commands.setLink(attributes);
        hide();
      }}
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
  const { editor } = props;
  const { selectedNode, hide } = useHoverPopupContext();
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
        hide();
      }}
    />
  );
}

export function OpenLink(props: ToolProps) {
  const { editor } = props;
  const { selectedNode: _selectedNode, hide } = useHoverPopupContext();
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
          hide();
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
          hide();
        }}
      />
    </Flex>
  );
}

export function CopyLink(props: ToolProps) {
  const { editor } = props;
  const { selectedNode: _selectedNode, hide } = useHoverPopupContext();
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
        editor.storage.copyToClipboard?.(href);
        hide();
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
        desktop="popup"
        position={{
          target: buttonRef.current || undefined,
          isTargetAbsolute: true,
          location: "below",
          align: "center",
          yOffset: 5
        }}
        title={isEditing ? strings.editLink() : strings.insertLink()}
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

export function isInternalLink(href?: string | null) {
  return typeof href === "string" ? href.startsWith("nn://") : false;
}
