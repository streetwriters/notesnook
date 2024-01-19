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
  Editor,
  getFontById,
  getTableOfContents,
  PortalProvider,
  TiptapOptions,
  Toolbar,
  usePermissionHandler,
  useTiptap
} from "@notesnook/editor";
import { toBlobURL } from "@notesnook/editor/dist/utils/downloader";
import { useThemeColors } from "@notesnook/theme";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEditorController } from "../hooks/useEditorController";
import { useSettings } from "../hooks/useSettings";
import {
  TabItem,
  TabStore,
  useTabContext,
  useTabStore
} from "../hooks/useTabStore";
import { EmotionEditorToolbarTheme } from "../theme-factory";
import { EventTypes, Settings } from "../utils";
import Header from "./header";
import StatusBar from "./statusbar";
import Tags from "./tags";
import Title from "./title";

globalThis.toBlobURL = toBlobURL;

const Tiptap = ({
  settings,
  getContentDiv
}: {
  settings: Settings;
  getContentDiv: () => HTMLElement;
}) => {
  const contentPlaceholderRef = useRef<HTMLDivElement>(null);
  const { colors } = useThemeColors();
  const tab = useTabContext();
  const isFocused = useTabStore((state) => state.currentTab === tab?.id);
  const [tick, setTick] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const noteStateUpdateTimer = useRef<NodeJS.Timeout>();
  const tabRef = useRef<TabItem>(tab);
  const isFocusedRef = useRef<boolean>(false);
  tabRef.current = tab;

  usePermissionHandler({
    claims: {
      premium: settings.premium
    },
    onPermissionDenied: () => {
      post(EventTypes.pro, undefined, tab.id, tab.noteId);
    }
  });

  const tiptapOptions = useMemo<Partial<TiptapOptions>>(() => {
    return {
      onUpdate: ({ editor }) => {
        globalThis.editorControllers[tab.id]?.contentChange(editor as Editor);
      },
      onOpenAttachmentPicker: (editor, type) => {
        globalThis.editorControllers[tab.id]?.openFilePicker(type);
        return true;
      },
      onDownloadAttachment: (editor, attachment) => {
        globalThis.editorControllers[tab.id]?.downloadAttachment(attachment);
        return true;
      },
      onPreviewAttachment(editor, attachment) {
        globalThis.editorControllers[tab.id]?.previewAttachment(attachment);
        return true;
      },
      element: getContentDiv(),
      editable: !settings.readonly,
      editorProps: {
        editable: () => !settings.readonly
      },
      content: globalThis.editorControllers[tab.id]?.content?.current,
      isMobile: true,
      doubleSpacedLines: settings.doubleSpacedLines,
      onOpenLink: (url) => {
        return globalThis.editorControllers[tab.id]?.openLink(url) || true;
      },
      copyToClipboard: (text) => {
        globalThis.editorControllers[tab.id]?.copyToClipboard(text);
      },
      onSelectionUpdate: () => {
        if (tab.noteId) {
          const noteId = tab.noteId;
          clearTimeout(noteStateUpdateTimer.current);
          noteStateUpdateTimer.current = setTimeout(() => {
            if (tab.noteId !== noteId) return;
            const { to, from } =
              editors[tabRef.current?.id]?.state.selection || {};
            useTabStore.getState().setNoteState(noteId, {
              to,
              from
            });
          }, 500);
        }
      },
      downloadOptions: {
        corsHost: settings.corsProxy
      },
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat as "12-hour" | "24-hour" | undefined
    };
  }, [settings.readonly, tick, settings.doubleSpacedLines]);

  const _editor = useTiptap(tiptapOptions, [tiptapOptions]);

  const update = useCallback(() => {
    logger("info", "update content");
    setTick((tick) => tick + 1);
    setTimeout(() => {
      const noteState = tabRef.current.noteId
        ? useTabStore.getState().noteState[tabRef.current.noteId]
        : undefined;
      const top = noteState?.top;

      if (noteState?.to || noteState?.from) {
        editors[tabRef.current.id]?.chain().setTextSelection({
          to: noteState.to,
          from: noteState.from
        });
      }

      containerRef.current?.scrollTo({
        left: 0,
        top: top || 0,
        behavior: "auto"
      });
    }, 32);

    globalThis.editorControllers[tabRef.current.id]?.setTitlePlaceholder(
      "Note title"
    );
    setTimeout(() => {
      editorControllers[tabRef.current.id]?.setLoading(false);
    });
  }, []);

  const controller = useEditorController({
    update,
    getTableOfContents: () => {
      return !containerRef.current
        ? []
        : getTableOfContents(containerRef.current);
    }
  });
  const controllerRef = useRef(controller);

  globalThis.editorControllers[tab.id] = controller;
  globalThis.editors[tab.id] = _editor;

  useLayoutEffect(() => {
    if (!getContentDiv().parentElement) {
      contentPlaceholderRef.current?.appendChild(getContentDiv());
    }

    const updateScrollPosition = (state: TabStore) => {
      if (isFocusedRef.current) return;
      if (state.currentTab === tabRef.current.id) {
        isFocusedRef.current = true;
        const noteState = tabRef.current.noteId
          ? state.noteState[tabRef.current.noteId]
          : undefined;
        if (noteState) {
          containerRef.current?.scrollTo({
            left: 0,
            top: noteState.top,
            behavior: "auto"
          });
          if (noteState.to || noteState.from) {
            editors[tabRef.current.id]?.chain().setTextSelection({
              to: noteState.to,
              from: noteState.from
            });
          }
        }

        if (
          !globalThis.editorControllers[tabRef.current.id]?.content.current &&
          tabRef.current.noteId
        ) {
          editorControllers[tabRef.current.id]?.setLoading(true);
        }

        post(
          EventTypes.tabFocused,
          !!globalThis.editorControllers[tabRef.current.id]?.content.current,
          tabRef.current.id,
          state.getCurrentNoteId()
        );
        editorControllers[tabRef.current.id]?.updateTab();
      } else {
        isFocusedRef.current = false;
      }
    };

    updateScrollPosition(useTabStore.getState());
    const unsub = useTabStore.subscribe((state, prevState) => {
      if (state.currentTab !== tabRef.current.id) {
        isFocusedRef.current = false;
      }
      if (state.currentTab === prevState.currentTab) return;
      updateScrollPosition(state);
    });
    return () => {
      unsub();
    };
  }, []);

  const onClickEmptyArea: React.MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      const y = event.nativeEvent.pageY;
      const x = event.nativeEvent.pageX;
      const element = document.elementFromPoint(x, y);
      if (!element) return;
      if (element.id === "statusbar" || element.id === "header") {
        if (
          containerRef.current?.scrollTop &&
          containerRef.current?.scrollTop > 0
        ) {
          containerRef.current?.scrollTo({
            left: 0,
            top: 0,
            behavior: "smooth"
          });
          return;
        }

        const editor = editors[tab.id];

        const firstChild = editor?.state.doc.firstChild;
        const isParagraph = firstChild?.type.name === "paragraph";
        const isFirstChildEmpty =
          !firstChild?.textContent || firstChild?.textContent?.length === 0;
        if (isParagraph && isFirstChildEmpty) {
          editor?.commands.focus("end");
          return;
        }
        editor
          ?.chain()
          .insertContentAt(0, "<p></p>", {
            updateSelection: true
          })
          .focus("end")
          .run();
      }
    },
    [tab.id]
  );

  const onClickBottomArea = useCallback(() => {
    const editor = editors[tab.id];
    const docSize = editor?.state.doc.content.size;
    if (!docSize) return;
    const lastChild = editor?.state.doc.lastChild;
    const isParagraph = lastChild?.type.name === "paragraph";
    const isLastChildEmpty =
      !lastChild?.textContent || lastChild?.textContent?.length === 0;
    if (isParagraph && isLastChildEmpty) {
      editor?.commands.focus("end");
      return;
    }
    editor
      ?.chain()
      .insertContentAt(docSize - 1, "<p></p>", {
        updateSelection: true
      })
      .focus("end")
      .run();
  }, [tab.id]);

  return (
    <>
      <div
        style={{
          display: isFocused ? "flex" : "none",
          flex: 1,
          flexDirection: "column",
          maxWidth: "100vw"
        }}
        id="editorroot"
        onDoubleClick={onClickEmptyArea}
      >
        <Header
          hasRedo={_editor?.can().redo() || false}
          hasUndo={_editor?.can().undo() || false}
          settings={settings}
          noHeader={settings.noHeader || false}
        />

        <div
          onScroll={controller.scroll}
          ref={containerRef}
          style={{
            overflowY: "scroll",
            height: "100%",
            display: "block",
            position: "relative"
          }}
        >
          {settings.noHeader ? null : (
            <>
              <Tags settings={settings} />
              <Title
                titlePlaceholder={controller.titlePlaceholder}
                readonly={settings.readonly}
                controller={controllerRef}
                title={controller.title}
                fontFamily={settings.fontFamily}
                dateFormat={settings.dateFormat}
                timeFormat={settings.timeFormat}
              />
              <StatusBar container={containerRef} />
            </>
          )}

          {controller.loading || tab.locked ? (
            <div
              style={{
                width: "100%",
                height: "95%",
                position: "absolute",
                zIndex: 999,
                backgroundColor: colors.primary.background,
                paddingRight: 12,
                paddingLeft: 12,
                display: "flex",
                flexDirection: "column"
              }}
            >
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

          <div
            onClick={onClickBottomArea}
            style={{
              flexGrow: 1,
              width: "100%",
              minHeight: 250
            }}
          />
        </div>

        {tab.locked ? null : (
          <EmotionEditorToolbarTheme>
            <Toolbar
              className="theme-scope-editorToolbar"
              sx={{
                display: settings.noToolbar ? "none" : "flex",
                overflowY: "hidden",
                minHeight: "50px",
                backgroundColor: "red"
              }}
              editor={_editor}
              location="bottom"
              tools={[...settings.tools]}
              defaultFontFamily={settings.fontFamily}
              defaultFontSize={settings.fontSize}
            />
          </EmotionEditorToolbarTheme>
        )}
      </div>
    </>
  );
};

const TiptapProvider = (): JSX.Element => {
  const settings = useSettings();
  const { colors } = useThemeColors("editor");
  const contentRef = useRef<HTMLElement>();
  return (
    <PortalProvider>
      <Tiptap
        settings={settings}
        getContentDiv={() => {
          if (contentRef.current) {
            logger("info", "return content");
            return contentRef.current;
          }
          logger("info", "new content");
          const editorContainer = document.createElement("div");
          editorContainer.classList.add("selectable");
          editorContainer.style.flex = "1";
          editorContainer.style.cursor = "text";
          editorContainer.style.padding = "0px 12px";
          editorContainer.style.color =
            colors?.primary?.paragraph || colors.primary.paragraph;
          editorContainer.style.paddingBottom = `150px`;
          editorContainer.style.fontSize = `${settings.fontSize}px`;
          editorContainer.style.fontFamily =
            getFontById(settings.fontFamily)?.font || "sans-serif";
          contentRef.current = editorContainer;
          return editorContainer;
        }}
      />
    </PortalProvider>
  );
};

export default TiptapProvider;
