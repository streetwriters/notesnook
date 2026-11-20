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
import {
  codegenNativeCommands,
  codegenNativeComponent,
  type CodegenTypes,
  type HostComponent,
  type ViewProps
} from "react-native";

export type QueryResultsEvent = Readonly<{
  revision: CodegenTypes.Double;
  /** JSON object: query key to its new value, only the keys that changed. */
  changed: string;
}>;

export type ContentChangeEvent = Readonly<{
  revision: CodegenTypes.Double;
}>;

export type SaveEvent = Readonly<{
  revision: CodegenTypes.Double;
  html: string;
}>;

export type HostActionEvent = Readonly<{
  kind: string;
  /** JSON-encoded payload of the action. */
  payload: string;
}>;

export type AttachmentRequestEvent = Readonly<{
  /** Pass back to `attachmentReady`. */
  id: CodegenTypes.Double;
  hash: string;
  mime: string;
  url: string;
}>;

export interface NativeProps extends ViewProps {
  readonly?: boolean;
  /** Identifies the note session; changing it resets the editor's view state. */
  sessionId?: string;
  /** JSON object of theme tokens (colours as CSS strings). */
  theme?: string;
  /** JSON object of view settings, `{ [name]: boolean }`. */
  settings?: string;
  onQueryResults?: CodegenTypes.DirectEventHandler<QueryResultsEvent>;
  onContentChange?: CodegenTypes.DirectEventHandler<ContentChangeEvent>;
  onSave?: CodegenTypes.DirectEventHandler<SaveEvent>;
  onHostAction?: CodegenTypes.DirectEventHandler<HostActionEvent>;
  onAttachmentRequest?: CodegenTypes.DirectEventHandler<AttachmentRequestEvent>;
}

export type NotesnookEditorNativeType = HostComponent<NativeProps>;

interface NativeCommands {
  run: (
    viewRef: React.ElementRef<NotesnookEditorNativeType>,
    commands: string
  ) => void;
  setQueries: (
    viewRef: React.ElementRef<NotesnookEditorNativeType>,
    queries: string
  ) => void;
  focus: (
    viewRef: React.ElementRef<NotesnookEditorNativeType>,
    position: string
  ) => void;
  setContent: (
    viewRef: React.ElementRef<NotesnookEditorNativeType>,
    html: string
  ) => void;
  requestSave: (viewRef: React.ElementRef<NotesnookEditorNativeType>) => void;
  attachmentReady: (
    viewRef: React.ElementRef<NotesnookEditorNativeType>,
    id: CodegenTypes.Double,
    path: string
  ) => void;
}

export const Commands: NativeCommands = codegenNativeCommands<NativeCommands>({
  supportedCommands: [
    "run",
    "setQueries",
    "focus",
    "setContent",
    "requestSave",
    "attachmentReady"
  ]
});

export default codegenNativeComponent<NativeProps>("NotesnookEditor", {
  interfaceOnly: true
});
