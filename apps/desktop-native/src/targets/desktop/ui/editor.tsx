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
import type { PickedFile } from "@platform/files";
import type * as Contract from "@notesnook/ui-kit/contracts/editor";
import { Flex } from "@notesnook/ui-kit/desktop/primitives";
import { useEditorThemeTokens } from "@notesnook/ui-kit/desktop/theme";
import {
  EDITOR_QUERIES,
  dispatchQueryResults,
  takeContent
} from "@notesnook/ui-kit/shared/editor-bridge";
import { ControllerToolbar } from "@notesnook/editor-ui/toolbar/toolbar.js";
import {
  createController,
  type EditorCommand
} from "@notesnook/editor-ui/controller.js";
import {
  createRemoteQueryStore,
  type WireQuery
} from "@notesnook/editor-ui/queries/remote-store.js";

const DEFAULT_FONT_FAMILY = "sans-serif";
const DEFAULT_FONT_SIZE = 16;

// The subset of `@notesnook/editor-native` this surface uses.
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
  onAttachmentRequest?: (r: { id: number; hash?: string }) => void;
};

// Resolved lazily so a build without the native component (type checks,
// unit tests) still loads; the editor area stays empty there.
let NativeEditor:
  | ForwardRefExoticComponent<NativeProps & RefAttributes<NativeHandle>>
  | undefined;
try {
  NativeEditor =
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("@notesnook/editor-native").NotesnookEditor;
} catch {
  NativeEditor = undefined;
}

function withEditorQueries(active: WireQuery[]): WireQuery[] {
  return [...EDITOR_QUERIES, ...active];
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

  const queries = useMemo(
    () =>
      createRemoteQueryStore((active) =>
        native.current?.setQueries(withEditorQueries(active))
      ),
    []
  );
  const controller = useMemo(
    () =>
      createController({
        queries,
        run: (commands: EditorCommand[]) => native.current?.run(commands),
        hostActions: {
          createInternalLink: async (attributes) =>
            latest.current.host?.createInternalLink?.(attributes),
          openAttachmentPicker: (type) => {
            void latest.current.host?.openAttachmentPicker?.(type);
          }
        }
      }),
    [queries]
  );

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
      instance.setQueries(withEditorQueries(queries.active()));
      load();
      latest.current.onReady?.(handle);
    },
    [handle, load, queries]
  );

  const theme = useMemo(
    () => ({ ...tokens } as unknown as Record<string, string>),
    [tokens]
  );

  const Native = NativeEditor;
  return (
    <Flex
      testID={props.testID ?? "editor-body"}
      sx={{ flex: 1, flexDirection: "column", ...props.sx }}
    >
      {Native && !props.readonly ? (
        <ControllerToolbar
          editor={controller}
          location="top"
          defaultFontFamily={DEFAULT_FONT_FAMILY}
          defaultFontSize={DEFAULT_FONT_SIZE}
          sx={{ flexWrap: "nowrap", flexShrink: 0 }}
        />
      ) : null}
      {Native ? (
        <Native
          ref={setRef}
          style={{ flex: 1 }}
          sessionId={props.sessionId}
          readonly={props.readonly}
          theme={theme}
          onQueryResults={({ changed }) => {
            queries.apply(changed);
            const next = dispatchQueryResults(changed, latest.current);
            if (next) selection.current = next;
          }}
          onContentChange={() => latest.current.onContentChange?.(html.current)}
          onSave={({ html: saved }) => {
            html.current = saved;
            latest.current.onSave?.(saved);
          }}
          onAttachmentRequest={({ id, hash }) => {
            const host = latest.current.host;
            if (!hash || !host?.resolveAttachmentPath) {
              native.current?.attachmentReady(id, null);
              return;
            }
            host
              .resolveAttachmentPath(hash)
              .then((path) => native.current?.attachmentReady(id, path ?? null))
              .catch(() => native.current?.attachmentReady(id, null));
          }}
          onHostAction={({ kind, payload }) => {
            const p = (payload ?? {}) as {
              hash?: string;
              url?: string;
              type?: string;
              files?: PickedFile[];
              openInNewTab?: boolean;
            };
            const host = latest.current.host;
            if (kind === "previewAttachment" && p.hash) {
              if (host?.previewAttachment)
                void host.previewAttachment({ hash: p.hash, type: p.type });
              else latest.current.onPreviewDocument?.(p.hash);
            } else if (kind === "downloadAttachment" && p.hash)
              void host?.downloadAttachment?.({ hash: p.hash });
            else if (kind === "openLink" && p.url)
              void host?.openLink?.(p.url, p.openInNewTab);
            else if (kind === "openAttachmentPicker")
              void host?.openAttachmentPicker?.(
                p.type === "file" || p.type === "camera" ? p.type : "image"
              );
            else if (kind === "pasteFiles" && p.files?.length)
              void host?.pasteFiles?.(p.files);
          }}
        />
      ) : null}
    </Flex>
  );
});
