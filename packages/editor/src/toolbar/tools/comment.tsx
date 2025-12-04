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
import { CommentPopup } from "../popups/comment-popup.js";
import { useRefValue } from "../../hooks/use-ref-value.js";
import { findMark, selectionToOffset } from "../../utils/prosemirror.js";
import { Box, Flex, Input, Text } from "@theme-ui/components";
import { useHoverPopupContext } from "../floating-menus/hover-popup/context.js";
import { strings } from "@notesnook/intl";
import { CommentAttributes } from "../../extensions/comment/index.js";
import { nanoid } from "nanoid";
import { getFormattedDate } from "@notesnook/common";

export function AddComment(props: ToolProps) {
  const { editor } = props;
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const isActive = editor.isActive("comment");

  if (isActive) return null;

  return (
    <>
      <ToolButton
        {...props}
        buttonRef={buttonRef}
        onClick={() => setIsOpen(true)}
        toggled={isOpen}
        disabled={editor.state.selection.empty}
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
        title={strings.addComment()}
        isOpen={isOpen}
        items={[]}
        onClose={() => {
          setIsOpen(false);
          editor.commands.focus();
        }}
        focusOnRender={false}
      >
        <CommentPopup
          onClose={() => setIsOpen(false)}
          onDone={(text: string) => {
            const commentId = `comment-${nanoid(8)}`;
            const attributes: CommentAttributes = {
              id: commentId,
              text,
              timestamp: Date.now()
            };
            editor.commands.setComment(attributes);
            setIsOpen(false);
          }}
        />
      </ResponsivePresenter>
    </>
  );
}

export function ViewComment(props: ToolProps) {
  const { editor } = props;
  const { selectedNode: _selectedNode, hide } = useHoverPopupContext();
  const selectedNode = useRefValue(
    _selectedNode || selectionToOffset(editor.state)
  );
  const { node } = selectedNode.current || {};
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const comment = node ? findMark(node, "comment") : null;
  const [commentAttributes, setCommentAttributes] = useState(
    comment ? (comment.attrs as CommentAttributes) : null
  );

  if (!commentAttributes) return null;

  function saveComment() {
    if (!commentAttributes) return null;

    if (selectedNode.current) {
      editor.chain().focus().setTextSelection(selectedNode.current).run();
    }

    const text = inputRef.current?.value || "";
    const attributes: CommentAttributes = {
      id: commentAttributes.id,
      text,
      timestamp: Date.now()
    };
    editor.commands.setComment(attributes);
    setIsEditing(false);
    setCommentAttributes(attributes);
  }

  return (
    <Flex sx={{ flexDirection: "column", gap: 1, px: 1 }}>
      <Flex sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Text sx={{ fontSize: "subBody" }}>
          {getFormattedDate(commentAttributes.timestamp, "date-time")}
        </Text>
        <Flex sx={{ alignItems: "center" }}>
          <ToolButton
            icon={"delete"}
            title={strings.deleteComment()}
            iconSize={"small"}
            onClick={() => {
              if (_selectedNode)
                editor.commands.setTextSelection({
                  from: _selectedNode.from,
                  to: _selectedNode.to
                });
              editor.chain().focus().unsetComment().run();
              hide();
            }}
          />
          {isEditing ? (
            <ToolButton
              icon={"save"}
              title={strings.saveComment()}
              iconSize={"small"}
              onClick={saveComment}
            />
          ) : (
            <ToolButton
              icon={"commentEdit"}
              title={strings.editComment()}
              iconSize={"small"}
              onClick={() => {
                if (editor.isEditable) {
                  setIsEditing(true);
                }
              }}
            />
          )}
        </Flex>
      </Flex>
      <Box
        sx={{
          minWidth: 200,
          maxWidth: 400,
          pb: 2
        }}
      >
        {isEditing ? (
          <Input
            autoFocus
            as={"textarea"}
            ref={inputRef}
            defaultValue={commentAttributes.text}
            onKeyUp={(e) => {
              if (e.key === "Enter" && e.ctrlKey) {
                saveComment();
              }
              if (e.key === "Escape") {
                e.stopPropagation();
                setIsEditing(false);
              }
            }}
            sx={{
              fontSize: "body",
              width: "100%",
              height: "fit-content"
            }}
          />
        ) : (
          <Text
            variant="body"
            sx={{
              textOverflow: "ellipsis",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word"
            }}
          >
            {commentAttributes.text}
          </Text>
        )}
      </Box>
    </Flex>
  );
}
