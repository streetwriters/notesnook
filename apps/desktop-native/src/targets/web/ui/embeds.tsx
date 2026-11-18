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
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import type * as AvatarContract from "../../../ui/avatar-editor";
import type * as PdfContract from "../../../ui/pdf";
import type * as WebViewContract from "../../../ui/webview";
import type * as OverlayContract from "../../../ui/overlays";
import { Flex, Text } from "./primitives";
import { getDragPayload } from "./use-dom";

function NotImplemented(props: { name: string; testID?: string }) {
  return (
    <Flex
      testID={props.testID}
      sx={{ flex: 1, alignItems: "center", justifyContent: "center", p: 2 }}
    >
      <Text sx={{ color: "paragraph" }}>
        {props.name} is not implemented on web
      </Text>
    </Flex>
  );
}

export const AvatarEditor = forwardRef<
  AvatarContract.AvatarEditorHandle,
  AvatarContract.AvatarEditorProps
>(function AvatarEditor(props, ref) {
  useImperativeHandle(
    ref,
    () => ({
      getScaledImage: async () => {
        throw new Error("AvatarEditor is not implemented on web");
      }
    }),
    []
  );
  return <NotImplemented name="AvatarEditor" testID={props.testID} />;
});

export const PdfViewer = forwardRef<
  PdfContract.PdfViewerHandle,
  PdfContract.PdfViewerProps
>(function PdfViewer(props, ref) {
  const fail = () => {
    throw new Error("PdfViewer is not implemented on web");
  };
  useImperativeHandle(
    ref,
    () => ({
      zoomIn: fail,
      zoomOut: fail,
      setZoom: fail,
      goToPage: fail,
      unlock: async () => fail(),
      search: async () => fail(),
      nextHit: fail,
      previousHit: fail,
      clearSearch: fail,
      getSelectedText: async () => fail(),
      download: async () => fail()
    }),
    []
  );
  return <NotImplemented name="PdfViewer" testID={props.testID} />;
});

export const WebView = forwardRef<
  WebViewContract.WebViewHandle,
  WebViewContract.WebViewProps
>(function WebView(props, ref) {
  const frame = useRef<HTMLIFrameElement>(null);
  const { onMessage } = props;
  useImperativeHandle(
    ref,
    () => ({
      postMessage: (message) => frame.current?.contentWindow?.postMessage(message, "*"),
      reload: () => frame.current?.contentWindow?.location.reload(),
      injectJavaScript: () => {
        throw new Error("WebView.injectJavaScript is not implemented on web");
      }
    }),
    []
  );
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      if (event.source === frame.current?.contentWindow)
        onMessage?.(
          typeof event.data === "string" ? event.data : JSON.stringify(event.data)
        );
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onMessage]);
  const source = props.source;
  return (
    <iframe
      ref={frame}
      data-test-id={props.testID}
      title="webview"
      sandbox="allow-scripts allow-forms allow-popups"
      src={"uri" in source ? source.uri : undefined}
      srcDoc={"html" in source ? source.html : undefined}
      onLoad={props.onLoad}
      style={{ flex: 1, border: 0, width: "100%", height: "100%" }}
    />
  );
});

export function DragGhostHost() {
  const [position, setPosition] = useState<{ x: number; y: number }>();
  const [ghost, setGhost] = useState<React.ReactNode>();
  useEffect(() => {
    const move = (event: DragEvent) => {
      const payload = getDragPayload() as OverlayContract.DragPayload | undefined;
      setGhost(payload?.ghost);
      setPosition({ x: event.clientX, y: event.clientY });
    };
    const end = () => setGhost(undefined);
    window.addEventListener("dragover", move);
    window.addEventListener("dragend", end);
    window.addEventListener("drop", end);
    return () => {
      window.removeEventListener("dragover", move);
      window.removeEventListener("dragend", end);
      window.removeEventListener("drop", end);
    };
  }, []);
  if (!ghost || !position) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: position.x + 12,
        top: position.y + 12,
        pointerEvents: "none",
        zIndex: 3000
      }}
    >
      {ghost}
    </div>
  );
}
