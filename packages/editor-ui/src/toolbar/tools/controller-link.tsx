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

import { useState } from "react";
import { strings } from "@notesnook/intl";
import { find } from "linkifyjs";
import { q } from "../../queries/queries.js";
import { useControllerQuery as useEditorQuery } from "../../queries/use-query.js";
import { ToolProps } from "../types.js";
import { ToolButton } from "../components/tool-button.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { NODE_NAMES } from "../../extension-types.js";
import {
  LinkPopup,
  isInternalLink,
  type LinkDefinition
} from "../popups/link-popup.js";

export function ControllerAddLink(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive(NODE_NAMES.link), false);
  const attributes = useEditorQuery(editor, q.attributes(NODE_NAMES.link), {});
  const isImageActive = useEditorQuery(
    editor,
    q.isActive(NODE_NAMES.image),
    false
  );
  const selectedText = useEditorQuery(
    editor,
    q.selectedText(NODE_NAMES.link),
    ""
  );
  const createInternalLink = editor.hostActions?.createInternalLink;
  const [link, setLink] = useState<LinkDefinition>();
  const href = typeof attributes.href === "string" ? attributes.href : "";

  return (
    <>
      <ToolButton
        icon={isActive ? "linkEdit" : props.icon}
        title={props.title}
        toggled={!!link}
        onClick={async () => {
          if (isActive && isInternalLink(href)) {
            const next = await createInternalLink?.({ href });
            if (!next) return;
            editor.run(
              { name: "extendMarkRange", args: [NODE_NAMES.link] },
              {
                name: "setLink",
                args: [{ ...next, title: selectedText || next.title }]
              }
            );
            return;
          }
          if (isActive) {
            setLink({ href, title: selectedText });
            return;
          }
          const detected =
            find(selectedText).find(
              (item) => item.isLink && item.href === selectedText
            )?.href ?? "";
          setLink({ href: detected, title: selectedText });
        }}
      />
      <ResponsivePresenter
        mobile="sheet"
        desktop="popup"
        editor={editor}
        anchor="selection"
        placement="bottom-start"
        title={isActive ? strings.editLink() : strings.insertLink()}
        isOpen={!!link}
        items={[]}
        onClose={() => setLink(undefined)}
        focusOnRender={false}
      >
        <LinkPopup
          link={link}
          isEditing={isActive}
          isImageActive={isImageActive}
          onClose={() => setLink(undefined)}
          onDone={(next) => {
            editor.run(
              ...(isActive
                ? [
                    { name: "extendMarkRange", args: [NODE_NAMES.link] },
                    { name: "setLink", args: [next] }
                  ]
                : [{ name: "toggleLink", args: [next] }])
            );
            setLink(undefined);
          }}
        />
      </ResponsivePresenter>
    </>
  );
}

export function ControllerAddInternalLink(props: ToolProps) {
  const { editor } = props;
  const isActive = useEditorQuery(editor, q.isActive(NODE_NAMES.link), false);
  const selectedText = useEditorQuery(editor, q.selectedText(), "");
  const createInternalLink = editor.hostActions?.createInternalLink;

  return (
    <ToolButton
      icon={props.icon}
      title={props.title}
      disabled={isActive}
      onClick={async () => {
        const link = await createInternalLink?.();
        if (!link) return;
        editor.run({
          name: "setLink",
          args: [{ ...link, title: selectedText || link.title }]
        });
      }}
    />
  );
}
