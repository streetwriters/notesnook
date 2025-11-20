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

import { Textarea } from "@theme-ui/components";
import { Flex } from "@theme-ui/components";
import { useState } from "react";
import { Popup } from "../components/popup.js";
import { strings } from "@notesnook/intl";
import { showPopup } from "../../components/popup-presenter/index.js";
import { ResponsivePresenter } from "../../components/responsive/index.js";
import { nanoid } from "nanoid";
import { CommentAttributes } from "../../extensions/comment/comment.js";
import { Editor } from "@tiptap/core";

export type CommentPopupProps = {
  onDone: (text: string) => void;
  onClose: () => void;
};

export function CommentPopup(props: CommentPopupProps) {
  const { onDone, onClose } = props;
  const [commentText, setCommentText] = useState("");

  return (
    <Popup
      title={strings.addComment()}
      onClose={onClose}
      action={{
        title: strings.add(),
        disabled: !commentText.trim(),
        onClick: () => onDone(commentText)
      }}
    >
      <Flex
        sx={{ p: 1, flexDirection: "column", width: ["auto", 300] }}
        onKeyUp={(e) => {
          if (e.key === "Enter" && e.ctrlKey && commentText.trim()) {
            onDone(commentText);
          }
        }}
      >
        <Textarea
          autoFocus
          placeholder={strings.writeComment()}
          value={commentText}
          rows={2}
          onChange={(e) => setCommentText(e.target.value)}
          sx={{
            fontFamily: "body",
            fontSize: "body",
            resize: "vertical"
          }}
        />
      </Flex>
    </Popup>
  );
}

export function showCommentPopup(editor: Editor) {
  if (!editor || editor.state.selection.empty || editor.isActive("comment")) {
    return;
  }

  showPopup({
    popup: (hide) => (
      <ResponsivePresenter
        mobile="sheet"
        desktop="popup"
        position={{
          target:
            (document.querySelector("#tool-comment") as HTMLElement) ||
            undefined,
          isTargetAbsolute: true,
          location: "below",
          align: "center",
          yOffset: 5
        }}
        title={strings.addComment()}
        isOpen={true}
        items={[]}
        onClose={() => {
          hide();
          editor.commands.focus();
        }}
        focusOnRender={true}
      >
        <CommentPopup
          onClose={() => {
            hide();
            editor.commands.focus();
          }}
          onDone={(text: string) => {
            const commentId = `comment-${nanoid(8)}`;
            const attributes: CommentAttributes = {
              id: commentId,
              text,
              timestamp: Date.now()
            };
            editor.commands.setComment(attributes);
            hide();
            editor.commands.focus();
          }}
        />
      </ResponsivePresenter>
    ),
    blocking: true,
    focusOnRender: true
  });
}
