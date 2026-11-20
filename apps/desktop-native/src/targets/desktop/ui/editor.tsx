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
  type ForwardRefExoticComponent,
  type RefAttributes
} from "react";
import type * as Contract from "@notesnook/ui-kit/contracts/editor";
import { Flex } from "@notesnook/ui-kit/desktop/primitives";
import { useEditorThemeTokens } from "@notesnook/ui-kit/desktop/theme";
import {
  EDITOR_QUERIES,
  dispatchQueryResults,
  takeContent
} from "@notesnook/ui-kit/shared/editor-bridge";

// The subset of `@notesnook/native-editor-react-native` this surface uses.
type NativeHandle = {
  run(commands: unknown): void;
  setQueries(queries: unknown): void;
  focus(position?: "start" | "end" | "all"): void;
  setContent(html: string): void;
  requestSave(): void;
  attachmentReady(id: number, path?: string | null): void;
};
type NativeProps = {
  readonly?: boolean;
  sessionId?: string;
  theme?: Record<string, string>;
  style?: unknown;
  onQueryResults?: (r: {
    revision: number;
    changed: Record<string, unknown>;
  }) => void;
  onContentChange?: (e: { revision: number }) => void;
  onSave?: (e: { revision: number; html: string }) => void;
  onHostAction?: (a: { kind: string; payload: unknown }) => void;
};

// Resolved lazily so a build without the native component (type checks,
// unit tests) still loads; the editor area stays empty there.
let NativeEditor:
  | ForwardRefExoticComponent<NativeProps & RefAttributes<NativeHandle>>
  | undefined;
try {
  NativeEditor =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@notesnook/native-editor-react-native").NotesnookEditor;
} catch {
  NativeEditor = undefined;
}

export const EditorSurface = forwardRef<
  Contract.EditorHandle,
  Contract.EditorSurfaceProps
>(function EditorSurface(props, ref) {
  const latest = useRef(props);
  latest.current = props;
  const native = useRef<NativeHandle | null>(null);
  // `getContent`/`getSelection` are synchronous but the editor answers through
  // events, so the last values it pushed are kept here.
  const html = useRef("");
  const selection = useRef<Contract.EditorSelection>({ from: 0, to: 0 });
  const unsaved = useRef<string | undefined>(undefined);
  const hidden = useRef(false);
  const tokens = useEditorThemeTokens();

  // Content typed since the last load survives a tab switch (unmount).
  useLayoutEffect(
    () => () => {
      unsaved.current = html.current;
    },
    []
  );

  const load = useCallback(() => {
    const next = takeContent(unsaved, latest.current.content);
    html.current = next;
    native.current?.setContent(next);
  }, []);

  const handle = useMemo<Contract.EditorHandle>(
    () => ({
      focus: (options) => {
        const editor = native.current;
        if (!editor) return;
        const position = options?.position;
        if (typeof position === "object") {
          editor.run({
            name: "setTextSelection",
            args: [{ from: position.from, to: position.to }]
          });
          selection.current = position;
          editor.focus("end");
        } else editor.focus(position ?? "end");
      },
      undo: () => native.current?.run({ name: "undo" }),
      redo: () => native.current?.run({ name: "redo" }),
      updateContent: (content) => {
        html.current = content;
        if (hidden.current) unsaved.current = content;
        native.current?.setContent(content);
      },
      getContent: () => html.current,
      getSelection: () => selection.current,
      attachFiles: (...files) =>
        native.current?.run({ name: "insertAttachments", payload: { files } }),
      sendAttachmentProgress: (hash, progress) =>
        native.current?.run({
          name: "updateAttachment",
          args: [hash, progress]
        }),
      startSearch: () => native.current?.run({ name: "startSearch" }),
      scrollToHeading: (id) =>
        native.current?.run({ name: "scrollToBlock", args: [id] })
    }),
    []
  );
  useImperativeHandle(ref, () => handle, [handle]);

  // Becoming visible again after a hidden tab reloads the latest content.
  useEffect(() => {
    if (hidden.current) {
      hidden.current = false;
      load();
    }
    return () => {
      hidden.current = true;
    };
  }, [load]);

  // A new session or nonce loads the note again.
  const { sessionId, nonce } = props;
  const firstLoad = useRef(true);
  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    load();
  }, [sessionId, nonce, load]);

  const setRef = useCallback(
    (instance: NativeHandle | null) => {
      native.current = instance;
      if (!instance) return;
      instance.setQueries(EDITOR_QUERIES);
      load();
      latest.current.onReady?.(handle);
    },
    [handle, load]
  );

  const theme = useMemo(
    () => ({ ...tokens } as unknown as Record<string, string>),
    [tokens]
  );

  const Native = NativeEditor;
  return (
    <Flex testID={props.testID ?? "editor-body"} sx={{ flex: 1, ...props.sx }}>
      {Native ? (
        <Native
          ref={setRef}
          style={{ flex: 1 }}
          sessionId={props.sessionId}
          readonly={props.readonly}
          theme={theme}
          onQueryResults={({ changed }) => {
            const next = dispatchQueryResults(changed, latest.current);
            if (next) selection.current = next;
          }}
          onContentChange={() => latest.current.onContentChange?.(html.current)}
          onSave={({ html: saved }) => {
            html.current = saved;
            latest.current.onSave?.(saved);
          }}
          onHostAction={({ kind, payload }) => {
            const hash = (payload as { hash?: string } | undefined)?.hash;
            if (kind === "previewAttachment" && hash)
              latest.current.onPreviewDocument?.(hash);
          }}
        />
      ) : null}
    </Flex>
  );
});
