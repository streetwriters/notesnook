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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { useEditorController } from "../hooks/useEditorController";
import { useSettings } from "../hooks/useSettings";
import {
  TabItem,
  TabStore,
  useTabContext,
  useTabStore
} from "../hooks/useTabStore";
import { EmotionEditorToolbarTheme } from "../theme-factory";
import { EventTypes, randId, Settings } from "../utils";
import Header from "./header";
import StatusBar from "./statusbar";
import Tags from "./tags";
import Title from "./title";
import FingerprintIcon from "mdi-react/FingerprintIcon";

globalThis.toBlobURL = toBlobURL as typeof globalThis.toBlobURL;

let didCallOnLoad = false;

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
  const biometryAvailable = useTabStore((state) => state.biometryAvailable);
  const biometryEnrolled = useTabStore((state) => state.biometryEnrolled);
  const editorRoot = useRef<HTMLDivElement>(null);
  const isFocusedRef = useRef<boolean>(false);
  tabRef.current = tab;

  usePermissionHandler({
    claims: {
      premium: settings.premium
    },
    onPermissionDenied: () => {
      post(EventTypes.pro, undefined, tabRef.current.id, tab.noteId);
    }
  });

  const tiptapOptions = useMemo<Partial<TiptapOptions>>(() => {
    return {
      onUpdate: ({ editor, transaction }) => {
        globalThis.editorControllers[tab.id]?.contentChange(
          editor as Editor,
          transaction.getMeta("ignoreEdit")
        );
      },
      openAttachmentPicker: (type) => {
        globalThis.editorControllers[tab.id]?.openFilePicker(type);
        return true;
      },
      downloadAttachment: (attachment) => {
        globalThis.editorControllers[tab.id]?.downloadAttachment(attachment);
        return true;
      },
      previewAttachment(attachment) {
        globalThis.editorControllers[tab.id]?.previewAttachment(attachment);
        return true;
      },
      getAttachmentData(attachment) {
        return globalThis.editorControllers[tab.id]?.getAttachmentData(
          attachment
        ) as Promise<string | undefined>;
      },
      createInternalLink(attributes) {
        logger("info", "create internal link");
        return new Promise((resolve) => {
          const id = randId("createInternalLink");

          globalThis.pendingResolvers[id] = (value) => {
            delete globalThis.pendingResolvers[id];
            resolve(value);
            logger("info", "resolved create link request:", id);
          };

          post("editor-events:create-internal-link", {
            attributes: attributes,
            resolverId: id
          });
        });
      },
      element: getContentDiv(),
      editable: !settings.readonly,
      editorProps: {
        editable: () => !settings.readonly
      },
      content: globalThis.editorControllers[tab.id]?.content?.current,
      isMobile: true,
      doubleSpacedLines: settings.doubleSpacedLines,
      openLink: (url) => {
        return globalThis.editorControllers[tab.id]?.openLink(url) || true;
      },
      copyToClipboard: (text) => {
        globalThis.editorControllers[tab.id]?.copyToClipboard(text);
      },
      onSelectionUpdate: () => {
        if (tabRef.current.noteId) {
          const noteId = tabRef.current.noteId;
          clearTimeout(noteStateUpdateTimer.current);
          noteStateUpdateTimer.current = setTimeout(() => {
            if (tabRef.current.noteId !== noteId) return;
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
      timeFormat: settings.timeFormat as "12-hour" | "24-hour" | undefined,
      enableInputRules: settings.markdownShortcuts
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    getContentDiv,
    settings.readonly,
    settings.doubleSpacedLines,
    settings.corsProxy,
    settings.dateFormat,
    settings.timeFormat,
    settings.markdownShortcuts,
    tick,
    tab.id
  ]);

  const _editor = useTiptap(tiptapOptions, [tiptapOptions]);

  const update = useCallback(() => {
    logger("info", "LOADING NOTE...");
    _editor.commands.setTextSelection(0);
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
    }, 300);
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
    const editorRootElement = editorRoot.current;
    editorRootElement?.classList.add("active");

    if (!didCallOnLoad) {
      didCallOnLoad = true;
      post("editor-events:load");
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
          !!globalThis.editorControllers[tabRef.current.id]?.content.current &&
            !editorControllers[tabRef.current.id]?.loading,
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
    logger("info", tabRef.current.id, "active");
    return () => {
      editorRootElement?.classList.remove("active");
      logger("info", tabRef.current.id, "inactive");
      unsub();
    };
  }, [getContentDiv]);

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
        ref={editorRoot}
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
            overflowY: controller.loading ? "hidden" : "scroll",
            height: "100%",
            display: "block",
            position: "relative"
          }}
        >
          {settings.noHeader || tab.locked ? null : (
            <>
              <Tags settings={settings} />

              {controller.loading ? null : (
                <>
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
            </>
          )}

          {controller.loading || tab.locked ? (
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
                alignItems: tab.locked ? "center" : "flex-start",
                justifyContent: tab.locked ? "center" : "flex-start",
                boxSizing: "border-box",
                rowGap: 10
              }}
            >
              {tab.locked ? (
                <>
                  <p
                    style={{
                      color: colors.primary.paragraph,
                      fontSize: 20,
                      fontWeight: "600",
                      textAlign: "center",
                      padding: "0px 20px",
                      marginBottom: 0,
                      userSelect: "none"
                    }}
                  >
                    {controller.title} ajklsdksa jdlksaj dksljk jdalkjskldj
                  </p>
                  <p
                    style={{
                      color: colors.primary.paragraph,
                      marginTop: 0,
                      marginBottom: 0,
                      userSelect: "none"
                    }}
                  >
                    This note is locked.
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const data = new FormData(e.currentTarget);
                      const password = data.get("password");
                      const biometrics = data.get("enrollBiometrics");
                      post("editor-events:unlock", {
                        password,
                        biometrics: biometrics === "on" ? true : false
                      });
                    }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      rowGap: 10
                    }}
                  >
                    <input
                      placeholder="Enter password"
                      ref={controller.passwordInputRef}
                      name="password"
                      type="password"
                      required
                      style={{
                        boxSizing: "border-box",
                        width: 300,
                        height: 45,
                        borderRadius: 5,
                        border: `1px solid ${colors.primary.border}`,
                        paddingLeft: 12,
                        paddingRight: 12,
                        fontSize: "1em",
                        backgroundColor: "transparent",
                        caretColor: colors.primary.accent,
                        color: colors.primary.paragraph
                      }}
                    />

                    <button
                      style={{
                        backgroundColor: colors.primary.accent,
                        borderRadius: 5,
                        boxSizing: "border-box",
                        border: "none",
                        color: colors.static.white,
                        width: 300,
                        fontSize: "0.9em",
                        height: 45,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                      onMouseDown={(e) => {
                        if (globalThis.keyboardShown) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <p
                        style={{
                          userSelect: "none"
                        }}
                      >
                        Unlock note
                      </p>
                    </button>

                    {biometryAvailable && !biometryEnrolled ? (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 5
                        }}
                      >
                        <input
                          type="checkbox"
                          name="enrollBiometrics"
                          style={{
                            accentColor: colors.primary.accent
                          }}
                          onMouseDown={(e) => {
                            if (globalThis.keyboardShown) {
                              e.preventDefault();
                            }
                          }}
                        />

                        <p
                          style={{
                            color: colors.primary.paragraph,
                            marginTop: 0,
                            marginBottom: 0,
                            userSelect: "none"
                          }}
                        >
                          Enable biometric unlocking
                        </p>
                      </div>
                    ) : null}
                  </form>

                  {biometryEnrolled && biometryAvailable ? (
                    <button
                      style={{
                        backgroundColor: "transparent",
                        borderRadius: 5,
                        boxSizing: "border-box",
                        border: "none",
                        color: colors.primary.accent,
                        width: 300,
                        fontSize: "0.9em",
                        height: 45,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        columnGap: 5,
                        userSelect: "none"
                      }}
                      onMouseDown={(e) => {
                        if (globalThis.keyboardShown) {
                          e.preventDefault();
                        }
                      }}
                      onClick={() => {
                        post("editor-events:unlock-biometrics");
                      }}
                    >
                      <FingerprintIcon />
                      <p
                        style={{
                          userSelect: "none"
                        }}
                      >
                        Unlock with biometrics
                      </p>
                    </button>
                  ) : null}
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          ) : null}

          <div ref={contentPlaceholderRef} className="theme-scope-editor" />

          <div
            onClick={(e) => {
              onClickBottomArea();
            }}
            onMouseDown={(e) => {
              if (globalThis.keyboardShown) {
                e.preventDefault();
              }
            }}
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

  return (
    <PortalProvider>
      <Tiptap settings={settings} getContentDiv={getContentDiv} />
    </PortalProvider>
  );
};

export default TiptapProvider;
