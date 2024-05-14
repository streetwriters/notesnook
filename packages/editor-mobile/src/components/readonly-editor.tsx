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
import { TiptapOptions, getFontById, useTiptap } from "@notesnook/editor";
import { useThemeColors } from "@notesnook/theme";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useSettings } from "../hooks/useSettings";
import { Settings, isReactNative, randId } from "../utils";
import { EditorEvents } from "../utils/editor-events";

export const ReadonlyEditorProvider = (): JSX.Element => {
  const settings = useSettings();
  const { colors } = useThemeColors("editor");
  const contentRef = useRef<HTMLElement>();
  const getContentDiv = useCallback(() => {
    if (contentRef.current) {
      return contentRef.current;
    }
    const editorContainer = document.createElement("div");
    editorContainer.classList.add("selectable");
    editorContainer.style.flex = "1";
    editorContainer.style.cursor = "text";
    editorContainer.style.padding = "0px 12px";
    editorContainer.style.color = colors.primary.paragraph;
    editorContainer.style.paddingBottom = `150px`;
    editorContainer.style.fontSize = `${settings.fontSize}px`;
    editorContainer.style.fontFamily =
      getFontById(settings.fontFamily)?.font || "sans-serif";
    contentRef.current = editorContainer;
    return editorContainer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.color = colors.primary.paragraph;
    }
  }, [colors]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.style.fontSize = `${settings.fontSize}px`;
      contentRef.current.style.fontFamily =
        getFontById(settings.fontFamily)?.font || "sans-serif";
    }
  }, [settings.fontSize, settings.fontFamily]);

  return <Tiptap settings={settings} getContentDiv={getContentDiv} />;
};

const Tiptap = ({
  settings,
  getContentDiv
}: {
  settings: Settings;
  getContentDiv: () => HTMLElement;
}) => {
  const contentPlaceholderRef = useRef<HTMLDivElement>(null);
  const { colors } = useThemeColors();
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRoot = useRef<HTMLDivElement>(null);
  const content = useRef();
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);

  const update = () => setTick((tick) => tick + 1);

  const tiptapOptions = useMemo<Partial<TiptapOptions>>(() => {
    return {
      getAttachmentData(attachment) {
        return new Promise<string>((resolve, reject) => {
          const resolverId = randId("get_attachment_data");
          pendingResolvers[resolverId] = (data) => {
            delete pendingResolvers[resolverId];
            resolve(data);
          };
          post(EditorEvents.getAttachmentData, {
            attachment,
            resolverId: resolverId
          });
        });
      },
      element: getContentDiv(),
      editable: false,
      editorProps: {
        editable: () => false
      },
      content: content.current,
      isMobile: true,
      doubleSpacedLines: settings.doubleSpacedLines,
      downloadOptions: {
        corsHost: settings.corsProxy
      },
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat as "12-hour" | "24-hour" | undefined,
      enableInputRules: settings.markdownShortcuts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getContentDiv,
    settings.doubleSpacedLines,
    settings.corsProxy,
    settings.dateFormat,
    settings.timeFormat,
    settings.markdownShortcuts,
    tick
  ]);

  const _editor = useTiptap(tiptapOptions, [tiptapOptions]);

  useLayoutEffect(() => {
    if (!getContentDiv().parentElement) {
      contentPlaceholderRef.current?.appendChild(getContentDiv());
    }
  }, [getContentDiv]);

  useEffect(() => {
    if (!isReactNative()) return; // Subscribe only in react native webview.
    const isSafari = navigator.vendor.match(/apple/i);
    let root: Document | Window = document;
    if (isSafari) {
      root = window;
    }
    post(EditorEvents.readonlyEditorLoaded);

    const onMessage = (event: any) => {
      if (event?.data?.[0] !== "{") return;
      const message = JSON.parse(event.data);
      const type = message.type;
      const value = message.value;

      if (type === "native:html") {
        content.current = value;
        update();
        setTimeout(() => {
          setLoading(false);
        });
      }

      if (type === "native:attachment-data") {
        if (pendingResolvers[value.resolverId]) {
          logger("info", "resolved data for attachment", value.resolverId);
          pendingResolvers[value.resolverId](value.data);
        }
      }
    };

    root.addEventListener("message", onMessage);

    return () => {
      root.removeEventListener("message", onMessage);
    };
  }, []);

  return (
    <>
      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          maxWidth: "100vw"
        }}
        ref={editorRoot}
      >
        <div
          ref={containerRef}
          style={{
            overflowY: loading ? "hidden" : "scroll",
            height: "100%",
            display: "block",
            position: "relative"
          }}
        >
          {loading ? (
            <div
              style={{
                width: "100%",
                height: "90%",
                position: "absolute",
                zIndex: 999,
                backgroundColor: colors.primary.background,
                paddingRight: 12,
                paddingLeft: 12,
                display: "flex",
                flexDirection: "column",
                boxSizing: "border-box",
                rowGap: 10
              }}
            >
              <div
                style={{
                  height: 25,
                  width: "94%",
                  backgroundColor: colors.secondary.background,
                  borderRadius: 5,
                  marginTop: 10
                }}
              />

              <div
                style={{
                  flexDirection: "row",
                  display: "flex",
                  gap: 10
                }}
              >
                <div
                  style={{
                    height: 12,
                    width: 40,
                    backgroundColor: colors.secondary.background,
                    borderRadius: 5,
                    marginTop: 10
                  }}
                />

                <div
                  style={{
                    height: 12,
                    width: 50,
                    backgroundColor: colors.secondary.background,
                    borderRadius: 5,
                    marginTop: 10
                  }}
                />

                <div
                  style={{
                    height: 12,
                    width: 100,
                    backgroundColor: colors.secondary.background,
                    borderRadius: 5,
                    marginTop: 10
                  }}
                />
              </div>

              <div
                style={{
                  height: 16,
                  width: "94%",
                  backgroundColor: colors.secondary.background,
                  borderRadius: 5,
                  marginTop: 10
                }}
              />

              <div
                style={{
                  height: 16,
                  width: "94%",
                  backgroundColor: colors.secondary.background,
                  borderRadius: 5,
                  marginTop: 10
                }}
              />

              <div
                style={{
                  height: 16,
                  width: 200,
                  backgroundColor: colors.secondary.background,
                  borderRadius: 5,
                  marginTop: 10
                }}
              />
            </div>
          ) : null}

          <div ref={contentPlaceholderRef} className="theme-scope-editor" />
        </div>
      </div>
    </>
  );
};
