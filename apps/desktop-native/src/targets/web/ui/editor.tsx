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

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { ThemeBridge } from "@notesnook/ui-kit/web/theme-bridge";
import Tiptap from "web-app-editor/tiptap";
import type { IEditor } from "web-app-editor/types";
import { useEditorManager } from "web-app-editor/manager";
import type * as Contract from "@notesnook/ui-kit/contracts/editor";
import { toPickedFile } from "../platform/files";

export const EditorSurface = forwardRef<
  Contract.EditorHandle,
  Contract.EditorSurfaceProps
>(function EditorSurface(props, ref) {
  const latest = useRef(props);
  latest.current = props;
  const instance = useRef<IEditor | undefined>(undefined);
  const id = props.sessionId;
  const [epoch, setEpoch] = useState(0);
  const hidden = useRef(false);
  const unsaved = useRef<string | undefined>(undefined);
  useLayoutEffect(
    () => () => {
      unsaved.current = instance.current?.getContent();
    },
    []
  );
  const source = props.content;
  const content = useCallback(() => {
    const value = unsaved.current ?? source();
    unsaved.current = undefined;
    return value;
  }, [source]);
  useEffect(() => {
    if (hidden.current) {
      hidden.current = false;
      setEpoch((value) => value + 1);
    }
    return () => {
      hidden.current = true;
    };
  }, []);

  const handle = useMemo<Contract.EditorHandle>(
    () => ({
      focus: (options) => instance.current?.focus(options),
      undo: () => instance.current?.undo(),
      redo: () => instance.current?.redo(),
      updateContent: (content) => {
        if (hidden.current) unsaved.current = content;
        instance.current?.updateContent(content);
      },
      getContent: () => instance.current?.getContent() ?? "",
      getSelection: () =>
        instance.current?.getSelection() ?? { from: 0, to: 0 },
      attachFiles: (...files) => instance.current?.attachFiles(...files),
      sendAttachmentProgress: () => {},
      startSearch: () => instance.current?.startSearch(),
      scrollToHeading: (headingId) => {
        document.getElementById(headingId)?.scrollIntoView({ block: "start" });
      }
    }),
    []
  );

  useImperativeHandle(ref, () => handle, [handle]);

  useEffect(
    () =>
      useEditorManager.subscribe(
        (state) => state.editors[id],
        (current, previous) => {
          if (!current) return;
          const callbacks = latest.current;
          if (current.statistics !== previous?.statistics && current.statistics)
            callbacks.onStatisticsChange?.(current.statistics);
          if (
            current.tableOfContents !== previous?.tableOfContents &&
            current.tableOfContents
          )
            callbacks.onHeadingsChange?.(
              current.tableOfContents.map(({ level, title, id }) => ({
                level,
                title,
                id
              }))
            );
          if (
            current.canUndo !== previous?.canUndo ||
            current.canRedo !== previous?.canRedo
          )
            callbacks.onUndoRedoChange?.({
              canUndo: !!current.canUndo,
              canRedo: !!current.canRedo
            });
        }
      ),
    [id]
  );

  const onLoad = useCallback(
    (editor?: IEditor) => {
      instance.current = editor;
      if (editor) latest.current.onReady?.(handle);
    },
    [handle]
  );

  const onChange = useCallback((content: () => string) => {
    latest.current.onSave?.(content());
  }, []);

  const onContentChange = useCallback(() => {
    const current = instance.current;
    if (current) latest.current.onContentChange?.(current.getContent());
  }, []);

  const onSelectionChange = useCallback(
    (range: { from: number; to: number }) => {
      latest.current.onSelectionChange?.({ from: range.from, to: range.to });
    },
    []
  );

  return (
    <div
      data-test-id={props.testID ?? "editor-body"}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        position: "relative"
      }}
    >
      <ThemeBridge
        sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}
      >
        <Tiptap
          key={epoch}
          id={id}
          readonly={props.readonly}
          nonce={props.nonce}
          content={content}
          onLoad={onLoad}
          onChange={onChange}
          onContentChange={onContentChange}
          onSelectionChange={onSelectionChange}
          onAutoSaveDisabled={() => latest.current.onAutoSaveDisabled?.()}
          onAttachFiles={(files) =>
            latest.current.onAttachFiles?.(files.map(toPickedFile))
          }
        />
      </ThemeBridge>
    </div>
  );
});
