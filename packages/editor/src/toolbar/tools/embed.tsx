import { ToolProps } from "../types";
import { ToolButton } from "../components/tool-button";
import { useMemo, useRef, useState } from "react";
import { Popup } from "../components/popup";
import { ResponsivePresenter } from "../../components/responsive";
import { MoreTools } from "../components/more-tools";
import { useToolbarLocation } from "../stores/toolbar-store";
import { findSelectedNode } from "../utils/prosemirror";
import { Embed } from "../../extensions/embed";
import { EmbedPopup } from "../popups/embed-popup";

export function EmbedSettings(props: ToolProps) {
  const { editor } = props;
  const isBottom = useToolbarLocation() === "bottom";
  if (!editor.isActive("embed") || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoCloseOnUnmount
      popupId="embedSettings"
      tools={[]}
    />
  );
}

export function EmbedAlignLeft(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setEmbedAlignment({ align: "left" })
          .run()
      }
    />
  );
}

export function EmbedAlignRight(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setEmbedAlignment({ align: "right" })
          .run()
      }
    />
  );
}

export function EmbedAlignCenter(props: ToolProps) {
  const { editor } = props;
  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={() =>
        editor.current
          ?.chain()
          .focus()
          .setEmbedAlignment({ align: "center" })
          .run()
      }
    />
  );
}

// TODO: stop re-rendering
export function EmbedProperties(props: ToolProps) {
  const { editor } = props;
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>();

  // TODO: improve perf by deferring this until user opens the popup
  const embedNode = useMemo(() => findSelectedNode(editor, "embed"), []);
  const embed = (embedNode?.attrs || {}) as Embed;

  return (
    <>
      <ToolButton
        buttonRef={buttonRef}
        toggled={isOpen}
        {...props}
        onClick={() => setIsOpen((s) => !s)}
      />

      <ResponsivePresenter
        isOpen={isOpen}
        desktop="menu"
        mobile="sheet"
        onClose={() => setIsOpen(false)}
        blocking
        focusOnRender={false}
        position={{
          target: buttonRef.current || "mouse",
          align: "start",
          location: "below",
          yOffset: 10,
          isTargetAbsolute: true,
        }}
      >
        <Popup
          title="Embed properties"
          onClose={() => {
            setIsOpen(false);
          }}
        >
          <EmbedPopup
            title="Embed properties"
            onClose={() => setIsOpen(false)}
            embed={embed}
            onSourceChanged={(src) => editor.commands.setEmbedSource(src)}
            onSizeChanged={(size) => editor.commands.setEmbedSize(size)}
          />
        </Popup>
      </ResponsivePresenter>
    </>
  );
}
