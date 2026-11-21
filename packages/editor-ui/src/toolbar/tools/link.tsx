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

import { q, findOffsetMark, type NodeOffset } from "../../queries/queries.js";
import {
  useControllerQuery as useEditorQuery,
  useControllerQueryReader
} from "../../queries/use-query.js";
import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { useEffect, useState } from "react";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import {
  LinkPopup,
  isInternalLink,
  type LinkDefinition
} from "../popups/link-popup.js";
import { useToolbarLocation } from "../stores/toolbar-store.js";
import { MoreTools } from "../components/more-tools.js";
import { NODE_NAMES } from "../../extension-types.js";
import { useHoverPopupContext } from "../floating-menus/hover-popup/context.js";
import { strings } from "@notesnook/intl";
import { find } from "linkifyjs";
import { Icons } from "../icons.js";
import { mdiNoteOutline, mdiBookOutline, mdiPound } from "@mdi/js";
import { LinkData } from "../../types.js";
import { callHostAction, getHostAction } from "../../host.js";
import { Flex, Icon, Link, Text, dataColor } from "@ui";

/**
 * The link the tool acts on: the node the hover popup is over, otherwise the
 * text run under the selection. Both are plain data read through the
 * controller, so the tools work the same on every engine.
 */
function useLinkTarget(props: ToolProps) {
  const { editor } = props;
  const { selectedNode: hovered, hide } = useHoverPopupContext();
  // The offset moves with every caret step, so it is only read when a button
  // is pressed. What the tool renders from is the link's own attributes,
  // which stay the same while the caret moves.
  const readOffset = useControllerQueryReader(editor, q.selectionOffset());
  const attributes = useEditorQuery(editor, q.attributes(NODE_NAMES.link), {});
  const link = findOffsetMark(hovered, NODE_NAMES.link);
  return {
    hide,
    hovered,
    getTarget: (): NodeOffset | undefined =>
      hovered ?? readOffset() ?? undefined,
    attributes: (link?.attrs ?? attributes) as { href?: string }
  };
}

export function LinkSettings(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive("link"), false);
  const isEditable = useEditorQuery(editor, q.editable(), true);
  const isBottom = useToolbarLocation() === "bottom";
  if (!isActive || !isBottom) return null;

  return (
    <MoreTools
      {...props}
      autoOpen
      autoCloseOnUnmount
      popupId="linkSettings"
      tools={
        isEditable
          ? ["openLink", "editLink", "removeLink", "copyLink"]
          : ["openLink", "copyLink"]
      }
    />
  );
}

export function AddLink(props: ToolProps) {
  const { editor } = props;

  const isActive = useEditorQuery(editor, q.isActive("link"), false);
  const readSelectedText = useControllerQueryReader(editor, q.selectedText());

  if (isActive) return <EditLink {...props} icon={"linkEdit"} />;
  return (
    <LinkTool
      {...props}
      onDone={(attributes) =>
        editor.run({ name: "toggleLink", args: [attributes] })
      }
      onClick={() => {
        const selectedText = readSelectedText() ?? "";
        const href =
          find(selectedText).find(
            (item) => item.isLink && item.href === selectedText
          )?.href ?? "";
        return { title: selectedText, href };
      }}
    />
  );
}

export function AddInternalLink(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive(NODE_NAMES.link), false);
  const readSelectedText = useControllerQueryReader(editor, q.selectedText());

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      disabled={isActive}
      onClick={async () => {
        const selectedText = readSelectedText() ?? "";
        const link = await getHostAction(editor, "createInternalLink")?.();
        if (!link) return;
        editor.run({
          name: "setLink",
          args: [{ ...link, title: selectedText || link.title }]
        });
      }}
    />
  );
}

export function EditLink(props: ToolProps) {
  const { editor } = props;
  const isEditable = useEditorQuery(editor, q.editable(), true);
  const readLinkText = useControllerQueryReader(
    editor,
    q.selectedText(NODE_NAMES.link)
  );
  const { hide, hovered, getTarget, attributes } = useLinkTarget(props);

  if (!isEditable) return null;
  if (isInternalLink(attributes.href))
    return (
      <EditInternalLink
        {...props}
        href={attributes.href as string}
        getTarget={getTarget}
        hide={hide}
      />
    );

  return (
    <LinkTool
      {...props}
      isEditing
      onDone={(link) => {
        editor.run(
          { name: "extendMarkRange", args: [NODE_NAMES.link] },
          { name: "setLink", args: [link] }
        );
        hide();
      }}
      onClick={() => {
        // read before the link under the caret becomes the selection
        const linkText = readLinkText() ?? "";
        const target = getTarget();
        // the link under the caret becomes the selection, as it always has,
        // so the popup and the save both act on the whole link
        editor.run({ name: "extendMarkRange", args: [NODE_NAMES.link] });

        const href = attributes.href;
        if (!href) return;

        const title = hovered?.text || linkText || target?.text || "";
        return { title, href };
      }}
    />
  );
}

function EditInternalLink(
  props: ToolProps & {
    href: string;
    getTarget: () => NodeOffset | undefined;
    hide: () => void;
  }
) {
  const { editor, href, getTarget, hide } = props;
  const readSelection = useControllerQueryReader(editor, q.selection());

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      onClick={async () => {
        const node = getTarget();
        const caret = readSelection();
        hide();
        const link = await getHostAction(
          editor,
          "createInternalLink"
        )?.({
          href
        });
        if (!link) return;
        const title = (node && node.text) || link.title;
        editor.run(
          ...(node
            ? [
                {
                  name: "setTextSelection",
                  args: [{ from: node.from, to: node.to }]
                }
              ]
            : []),
          { name: "setLink", args: [{ ...link, title }] },
          ...(node && caret
            ? [
                {
                  name: "setTextSelection",
                  args: [{ from: caret.from, to: caret.to }]
                }
              ]
            : [])
        );
      }}
    />
  );
}

export function RemoveLink(props: ToolProps) {
  const { editor } = props;
  const isEditable = useEditorQuery(editor, q.editable(), true);
  const { selectedNode, hide } = useHoverPopupContext();
  if (!isEditable) return null;
  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      toggled={false}
      onClick={() => {
        editor.run(
          ...(selectedNode
            ? [
                {
                  name: "setTextSelection",
                  args: [{ from: selectedNode.from, to: selectedNode.to }]
                }
              ]
            : []),
          { name: "unsetLink" }
        );
        hide();
      }}
    />
  );
}

export function OpenLink(props: ToolProps) {
  const { editor } = props;
  const { hide, attributes } = useLinkTarget(props);
  const href = attributes.href ?? null;
  const [loading, setLoading] = useState(false);
  const [linkData, setLinkData] = useState<LinkData | undefined>(undefined);

  useEffect(() => {
    if (!href || !isInternalLink(href)) return;

    (async () => {
      try {
        setLoading(true);
        const result = await getHostAction(editor, "getLinkData")?.(href);
        setLinkData(result);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    })();
  }, [href, editor]);

  if (!href) return null;

  const title = linkData?.title || href;

  return (
    <Flex sx={{ alignItems: "center" }}>
      {linkData?.type && (
        <LinkTypeIcon type={linkData.type} metadata={linkData.metadata} />
      )}
      {loading ? (
        <Text sx={{ fontSize: "subBody" }}>{strings.loading()}</Text>
      ) : (
        <Link
          href={href}
          onPress={(e) => {
            e.preventDefault();
            callHostAction(editor, "openLink", href);
            hide();
          }}
          sx={{
            fontSize: "subBody",
            fontFamily: "body",
            mr: 4,
            color: "accent",
            maxWidth: [150, 250],
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            ":hover": { color: "accent", opacity: 0.8 }
          }}
        >
          {title}
        </Link>
      )}
      <ToolButton
        icon={props.icon}
        title={props.title}
        toggled={false}
        onClick={() => {
          callHostAction(editor, "openLink", href);
          hide();
        }}
      />
    </Flex>
  );
}

export function CopyLink(props: ToolProps) {
  const { editor } = props;
  const { hide, attributes } = useLinkTarget(props);
  const href = attributes.href ?? null;
  if (!href) return null;

  return (
    <ToolButton
      {...props}
      toggled={false}
      onClick={async () => {
        const linkData = isInternalLink(href)
          ? await getHostAction(editor, "getLinkData")?.(href)
          : undefined;
        if (linkData?.title) {
          callHostAction(
            editor,
            "copyToClipboard",
            href,
            `<a href="${href}">${linkData.title}</a>`
          );
        } else {
          callHostAction(editor, "copyToClipboard", href);
        }
        hide();
      }}
    />
  );
}

export { isInternalLink, type LinkDefinition };
type LinkToolProps = ToolProps & {
  isEditing?: boolean;
  onDone: (link: LinkDefinition) => void;
  onClick: () => LinkDefinition | undefined;
};
function LinkTool(props: LinkToolProps) {
  const { isEditing, onClick, onDone, editor, ...toolProps } = props;
  const [isOpen, setIsOpen] = useState(false);

  const [linkDefinition, setLinkDefinition] = useState<LinkDefinition>();
  const isImageActive = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.image),
    false
  );

  return (
    <>
      <ToolButton
        {...toolProps}
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
        editor={editor}
        anchor="selection"
        placement="bottom-start"
        title={isEditing ? strings.editLink() : strings.insertLink()}
        isOpen={isOpen}
        items={[]}
        onClose={() => {
          setIsOpen(false);
          editor.run({ name: "focus" });
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

const LINK_TYPE_ICONS: Record<LinkData["type"], string> = {
  note: mdiNoteOutline,
  notebook: mdiBookOutline,
  tag: mdiPound,
  color: Icons.circle
};

function LinkTypeIcon({
  type,
  metadata
}: {
  type: LinkData["type"];
  metadata?: LinkData["metadata"];
}) {
  const path = LINK_TYPE_ICONS[type];
  if (!path) return null;

  const color =
    type === "color" && metadata?.colorCode
      ? dataColor(metadata.colorCode)
      : "icon-secondary";

  return <Icon path={path} color={color} size={13} mr={1} />;
}
