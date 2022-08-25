import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode } from "../utils/prosemirror";
import { Attachment } from "../../extensions/attachment";

export function AttachmentSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("attachment") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="attachmentSettings"
      tools={["downloadAttachment", "removeAttachment"]}
    />
  );
}

export function DownloadAttachment(props: ToolProps) {
  const { editor } = props;

  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => {
        const attachmentNode = findSelectedNode(editor, "attachment");
        const attachment = (attachmentNode?.attrs || {}) as Attachment;
        editor.current?.chain().focus().downloadAttachment(attachment).run();
      }}
    />
  );
}

export function RemoveAttachment(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() => editor.current?.chain().focus().removeAttachment().run()}
    />
  );
}
