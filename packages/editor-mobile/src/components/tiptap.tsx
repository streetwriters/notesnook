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
import { Editor, TiptapOptions, Toolbar, useTiptap } from "@notesnook/editor";
import { useEffect } from "react";
import { useTabContext } from "../hooks/useTabStore";
import { EmotionEditorToolbarTheme } from "../theme-factory";
import { Settings } from "../utils";
export default function TiptapEditorWrapper(props: {
  options: Partial<TiptapOptions>;
  onEditorUpdate: (editor: Editor) => void;
  settings: Settings;
}) {
  const tab = useTabContext();
  const editor = useTiptap(props.options, [props.options]);
  globalThis.editors[tab.id] = editor;

  useEffect(() => {
    props.onEditorUpdate(editor);
  }, [editor, props]);

  return (
    <>
      {tab.session?.locked ? null : (
        <EmotionEditorToolbarTheme>
          <Toolbar
            className="theme-scope-editorToolbar"
            sx={{
              display: props.settings.noToolbar ? "none" : "flex",
              overflowY: "hidden",
              minHeight: "50px"
            }}
            editor={editor}
            location="bottom"
            tools={
              Array.isArray(props.settings.tools)
                ? [...props.settings.tools]
                : []
            }
            defaultFontFamily={props.settings.fontFamily}
            defaultFontSize={props.settings.fontSize}
          />
        </EmotionEditorToolbarTheme>
      )}
    </>
  );
}
