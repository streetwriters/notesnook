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

import * as React from "react";
import type { ViewProps } from "react-native";
import NativeNotesnookEditor, {
  Commands,
  type NotesnookEditorNativeType
} from "./NotesnookEditorNativeComponent";

export type EditorQuery = {
  /** Result key; the same key comes back in `onQueryResults`. */
  key: string;
  /**
   * `isActive`, `attributes`, `can`, `selection`, `history`, `search`,
   * `statistics`, `headings`, `anchor`, `editable` or `focused`.
   */
  kind: string;
  args?: unknown[];
};

export type EditorCommand = {
  name: string;
  args?: unknown[];
  payload?: Record<string, unknown>;
};

export type QueryResults = {
  revision: number;
  changed: Record<string, unknown>;
};

export type HostAction = {
  kind: string;
  payload: unknown;
};

export type AttachmentRequest = {
  id: number;
  hash?: string;
  mime?: string;
  url?: string;
};

export type NotesnookEditorProps = Omit<ViewProps, "children"> & {
  readonly?: boolean;
  sessionId?: string;
  /** Theme tokens, colours as CSS strings. */
  theme?: Record<string, string>;
  /** View settings, `{ [name]: boolean }`. */
  settings?: Record<string, boolean>;
  onQueryResults?: (results: QueryResults) => void;
  /** The document changed. Cheap; call `requestSave` or wait for `onSave`. */
  onContentChange?: (event: { revision: number }) => void;
  /** The serialized note, debounced after edits and on `requestSave`. */
  onSave?: (event: { revision: number; html: string }) => void;
  onHostAction?: (action: HostAction) => void;
  /**
   * An image or clip needs bytes. Decrypt or download to a file and answer
   * with `attachmentReady(request.id, path)`.
   */
  onAttachmentRequest?: (request: AttachmentRequest) => void;
};

export type NotesnookEditorHandle = {
  /** Runs a batch of commands (Tiptap command names) in one transaction. */
  run(commands: EditorCommand | EditorCommand[]): void;
  /** Replaces the active queries; results arrive through `onQueryResults`. */
  setQueries(queries: EditorQuery[]): void;
  focus(position?: "start" | "end" | "all"): void;
  /** Replaces the document with a note's HTML. */
  setContent(html: string): void;
  /** Emits `onSave` now with the current document. */
  requestSave(): void;
  /** Answers an `onAttachmentRequest`; no path means it could not be read. */
  attachmentReady(id: number, path?: string | null): void;
};

function parse(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function json(value: unknown): string | undefined {
  return value === undefined ? undefined : JSON.stringify(value);
}

export const NotesnookEditor = React.forwardRef<
  NotesnookEditorHandle,
  NotesnookEditorProps
>(function NotesnookEditor(props, ref) {
  const {
    theme,
    settings,
    onQueryResults,
    onContentChange,
    onSave,
    onHostAction,
    onAttachmentRequest,
    ...rest
  } = props;
  const native =
    React.useRef<React.ElementRef<NotesnookEditorNativeType>>(null);

  React.useImperativeHandle(
    ref,
    () => ({
      run(commands) {
        if (native.current) {
          Commands.run(native.current, JSON.stringify(commands));
        }
      },
      setQueries(queries) {
        if (native.current) {
          Commands.setQueries(native.current, JSON.stringify(queries));
        }
      },
      focus(position = "end") {
        if (native.current) Commands.focus(native.current, position);
      },
      setContent(html) {
        if (native.current) Commands.setContent(native.current, html);
      },
      requestSave() {
        if (native.current) Commands.requestSave(native.current);
      },
      attachmentReady(id, path) {
        if (native.current) {
          Commands.attachmentReady(native.current, id, path ?? "");
        }
      }
    }),
    []
  );

  const themeJson = React.useMemo(() => json(theme), [theme]);
  const settingsJson = React.useMemo(() => json(settings), [settings]);

  return React.createElement(NativeNotesnookEditor, {
    ...rest,
    ref: native,
    theme: themeJson,
    settings: settingsJson,
    onQueryResults: onQueryResults
      ? (event) => {
          const { revision, changed } = event.nativeEvent;
          onQueryResults({ revision, changed: parse(changed) ?? {} });
        }
      : undefined,
    onContentChange: onContentChange
      ? (event) => onContentChange({ revision: event.nativeEvent.revision })
      : undefined,
    onSave: onSave
      ? (event) =>
          onSave({
            revision: event.nativeEvent.revision,
            html: event.nativeEvent.html
          })
      : undefined,
    onHostAction: onHostAction
      ? (event) =>
          onHostAction({
            kind: event.nativeEvent.kind,
            payload: parse(event.nativeEvent.payload)
          })
      : undefined,
    onAttachmentRequest: onAttachmentRequest
      ? (event) => {
          const { id, hash, mime, url } = event.nativeEvent;
          onAttachmentRequest({
            id,
            hash: hash || undefined,
            mime: mime || undefined,
            url: url || undefined
          });
        }
      : undefined
  });
});

export default NotesnookEditor;
