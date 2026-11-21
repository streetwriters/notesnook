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

/**
 * The glue between the JS handle and events (`index.ts`) and the native
 * component's wire format (JSON strings, flat event payloads). It imports
 * nothing from React Native, so it can be tested without a window.
 */

export type NativeCommands<Ref> = {
  run(ref: Ref, commands: string): void;
  setQueries(ref: Ref, queries: string): void;
  focus(ref: Ref, position: string): void;
  setContent(ref: Ref, html: string): void;
  requestSave(ref: Ref): void;
  attachmentReady(ref: Ref, id: number, path: string): void;
};

export function parse(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

export function json(value: unknown): string | undefined {
  return value === undefined ? undefined : JSON.stringify(value);
}

/**
 * The imperative handle. Every command is dropped while the native view is not
 * mounted (`getRef` returns null), and arguments are encoded as the native
 * side expects them.
 */
export function createHandle<Ref>(
  getRef: () => Ref | null,
  commands: NativeCommands<Ref>
) {
  return {
    run(batch: unknown) {
      const ref = getRef();
      if (ref) commands.run(ref, JSON.stringify(batch));
    },
    setQueries(queries: unknown) {
      const ref = getRef();
      if (ref) commands.setQueries(ref, JSON.stringify(queries));
    },
    focus(position: "start" | "end" | "all" = "end") {
      const ref = getRef();
      if (ref) commands.focus(ref, position);
    },
    setContent(html: string) {
      const ref = getRef();
      if (ref) commands.setContent(ref, html);
    },
    requestSave() {
      const ref = getRef();
      if (ref) commands.requestSave(ref);
    },
    attachmentReady(id: number, path?: string | null) {
      const ref = getRef();
      if (ref) commands.attachmentReady(ref, id, path ?? "");
    }
  };
}

type Event<T> = { nativeEvent: T };

/**
 * Turns the handlers of `NotesnookEditorProps` into native event handlers.
 * A handler that was not given stays undefined, so the native side does not
 * emit that event at all.
 */
export function adaptEvents(handlers: {
  onQueryResults?: (r: {
    revision: number;
    changed: Record<string, any>;
  }) => void;
  onContentChange?: (e: { revision: number }) => void;
  onSave?: (e: { revision: number; html: string }) => void;
  onHostAction?: (a: { kind: string; payload: unknown }) => void;
  onAttachmentRequest?: (r: {
    id: number;
    hash?: string;
    mime?: string;
    url?: string;
  }) => void;
}) {
  const { onQueryResults, onContentChange, onSave, onHostAction } = handlers;
  const { onAttachmentRequest } = handlers;
  return {
    onQueryResults: onQueryResults
      ? (event: Event<{ revision: number; changed: string }>) => {
          const { revision, changed } = event.nativeEvent;
          onQueryResults({ revision, changed: parse(changed) ?? {} });
        }
      : undefined,
    onContentChange: onContentChange
      ? (event: Event<{ revision: number }>) =>
          onContentChange({ revision: event.nativeEvent.revision })
      : undefined,
    onSave: onSave
      ? (event: Event<{ revision: number; html: string }>) =>
          onSave({
            revision: event.nativeEvent.revision,
            html: event.nativeEvent.html
          })
      : undefined,
    onHostAction: onHostAction
      ? (event: Event<{ kind: string; payload: string }>) =>
          onHostAction({
            kind: event.nativeEvent.kind,
            payload: parse(event.nativeEvent.payload)
          })
      : undefined,
    onAttachmentRequest: onAttachmentRequest
      ? (
          event: Event<{ id: number; hash: string; mime: string; url: string }>
        ) => {
          const { id, hash, mime, url } = event.nativeEvent;
          onAttachmentRequest({
            id,
            hash: hash || undefined,
            mime: mime || undefined,
            url: url || undefined
          });
        }
      : undefined
  };
}
