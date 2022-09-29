/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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

import React, { useEffect, useRef } from "react";
import { Input } from "@theme-ui/components";
import { useStore, store } from "../../stores/editor-store";
import { debounceWithId } from "../../utils/debounce";

type TitleBoxProps = {
  readonly: boolean;
};

function TitleBox(props: TitleBoxProps) {
  const { readonly } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const title = useStore((store) => store.session.title);
  const id = useStore((store) => store.session.id);

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = title;
  }, [id]);

  return (
    <Input
      ref={inputRef}
      variant="clean"
      data-test-id="editor-title"
      className="editorTitle"
      placeholder={"Note title"}
      readOnly={readonly}
      sx={{
        p: 0,
        fontFamily: "heading",
        fontSize: ["1.625em", "1.625em", "2.625em"],
        fontWeight: "heading",
        width: "100%"
      }}
      onChange={(e) => {
        const { sessionId, id } = store.get().session;
        debouncedOnTitleChange(sessionId, id, e.target.value);
      }}
    />
  );
}

export default React.memo(TitleBox, (prevProps, nextProps) => {
  return prevProps.readonly === nextProps.readonly;
});

function onTitleChange(noteId: string, title: string) {
  if (!title) return;
  store.get().setTitle(noteId, title);
}

const debouncedOnTitleChange = debounceWithId(onTitleChange, 100);
