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
  Activity,
  Suspense,
  lazy,
  memo,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { strings } from "@notesnook/intl";
import {
  Button,
  EditorSurface,
  type EditorHandle,
  Flex,
  Pane,
  Progress,
  ScrollContainer,
  SplitPane,
  Text,
  ThemeScope
} from "@ui";
import { EVENTS } from "@notesnook/core";
import {
  SaveState,
  useEditorStore,
  type DefaultEditorSession,
  type DeletedEditorSession,
  type NewEditorSession,
  type ReadonlyEditorSession
} from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import { AppEventManager, AppEvents } from "../../common/app-events";
import { db } from "../../common/db";
import { debounceWithId } from "@notesnook/common";
import DiffViewer from "../diff-viewer";
import { UnlockView } from "../unlock";
import { Loading } from "../icons";
import Properties from "../properties";
import Header from "./header";
import TitleBox from "./title-box";
import { saveContent } from "./save-content";
import { useEditorManager } from "./manager";

export { saveContent };

const PdfPreview = lazy(() => import("../pdf-preview"));
const deferredSave = debounceWithId(saveContent, 100);

export default function TabsView() {
  const tabs = useEditorStore((store) => store.tabs);
  const documentPreview = useEditorStore((store) => store.documentPreview);
  const activeTabId = useEditorStore((store) => store.activeTabId);
  const activeSession = useEditorStore((store) => store.getActiveSession());
  const propertiesTab = useEditorStore((store) => store.propertiesTab);

  return (
    <ThemeScope scope="editor">
      <Flex
        testID="editor-tabs-view"
        sx={{ bg: "background", flex: 1, overflow: "hidden" }}
      >
        <SplitPane direction="vertical" autoSaveId="editor-panels">
          <Pane id="editor-panel">
            {tabs.map((tab) => {
              const session = useEditorStore
                .getState()
                .getSession(tab.sessionId);
              if (!session) return null;
              return (
                <Activity
                  key={session.id}
                  mode={tab.id === activeTabId ? "visible" : "hidden"}
                >
                  {session.type === "locked" ? (
                    <UnlockNoteView session={session} />
                  ) : session.type === "conflicted" ||
                    session.type === "diff" ? (
                    <DiffViewer session={session} />
                  ) : (
                    <MemoizedEditorView session={session} />
                  )}
                </Activity>
              );
            })}
          </Pane>
          {documentPreview ? (
            <Pane id="pdf-preview-panel" initialSize={435} minSize={435}>
              <ThemeScope scope="editorSidebar">
                <Flex
                  sx={{
                    flex: 1,
                    flexDirection: "column",
                    overflow: "hidden",
                    borderLeft: "1px solid",
                    borderLeftColor: "border",
                    bg: "background"
                  }}
                >
                  {documentPreview.url ? (
                    <Suspense fallback={<Loading />}>
                      <PdfPreview
                        fileUrl={documentPreview.url}
                        hash={documentPreview.hash}
                        onClose={() =>
                          useEditorStore.setState({
                            documentPreview: undefined
                          })
                        }
                      />
                    </Suspense>
                  ) : (
                    <DownloadAttachmentProgress hash={documentPreview.hash} />
                  )}
                </Flex>
              </ThemeScope>
            </Pane>
          ) : null}
          {propertiesTab !== undefined &&
          activeSession &&
          activeSession.type !== "new" &&
          activeSession.type !== "locked" ? (
            <Pane id="properties-pane" initialSize={285} minSize={250}>
              <Properties sessionId={activeSession.id} />
            </Pane>
          ) : null}
        </SplitPane>
      </Flex>
    </ThemeScope>
  );
}

type EditableSession =
  | DefaultEditorSession
  | NewEditorSession
  | ReadonlyEditorSession
  | DeletedEditorSession;

const MemoizedEditorView = memo(EditorView, (prev, next) => {
  if (prev.session.id !== next.session.id) return false;
  if (prev.session.type !== next.session.type) return false;
  return prev.session.needsHydration === next.session.needsHydration;
});

function EditorView({ session }: { session: EditableSession }) {
  const lastChangedTime = useRef(0);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const editorMargins = useEditorStore((store) => store.editorMargins);

  useEffect(() => {
    const event = db.eventManager.subscribe(
      EVENTS.syncItemMerged,
      async (item?: {
        type?: string;
        id?: string;
        noteId?: string;
        title?: string;
        dateModified?: number;
      }) => {
        if (
          session.type === "new" ||
          !session.note ||
          !item ||
          !useAppStore.getState().isRealtimeSyncEnabled
        )
          return;
        if (
          item.type === "note" &&
          item.id === session.note.id &&
          session.note.title !== item.title
        ) {
          AppEventManager.publish(AppEvents.changeNoteTitle, {
            sessionId: session.id,
            title: item.title,
            preventSave: true
          });
        }
      }
    );
    return () => {
      event.unsubscribe();
    };
  }, [session]);

  const editor = useEditorManager((store) => store.editors[session.id]?.editor);
  const focusKey = "note" in session ? session.note?.id : session.id;
  useEffect(() => {
    editor?.focus();
  }, [editor, focusKey]);

  const sessionId = session.id;
  const onReady = useCallback(
    (handle: EditorHandle) =>
      useEditorManager.getState().setEditor(sessionId, { editor: handle }),
    [sessionId]
  );

  const getContent = useCallback(() => {
    const data = session.content?.data;
    return typeof data === "string" ? data : undefined;
  }, [session.content?.data]);

  if (session.needsHydration) return null;

  const readonly = session.type === "readonly" || session.type === "deleted";

  return (
    <Flex
      testID="editor-container"
      sx={{
        position: "relative",
        alignSelf: "stretch",
        overflow: "hidden",
        flex: 1,
        flexDirection: "column",
        bg: "background"
      }}
    >
      <ScrollContainer sx={{ flex: 1 }}>
        <Flex
          sx={{
            alignSelf: isFocusMode || editorMargins ? "center" : "stretch",
            maxWidth: editorMargins ? 850 : undefined,
            width: "100%",
            flex: 1,
            flexDirection: "column",
            px: 6
          }}
        >
          <Flex testID="editor-toolbar" sx={{ height: 34, flexShrink: 0 }} />
          <TitleBox id={session.id} readonly={readonly} />
          <Header id={session.id} readonly={readonly} />
          <EditorSurface
            sessionId={session.id}
            readonly={readonly}
            content={getContent}
            onContentChange={() => (lastChangedTime.current = Date.now())}
            onSave={(html) => {
              const currentSession = useEditorStore
                .getState()
                .getSession(session.id);
              const noteId =
                currentSession && "note" in currentSession
                  ? currentSession.note.id
                  : null;
              const sessions = noteId
                ? useEditorStore.getState().getSessionsForNote(noteId)
                : [currentSession];
              for (const other of sessions) {
                if (
                  other?.type !== "default" &&
                  other?.type !== "readonly" &&
                  other?.type !== "new"
                )
                  continue;
                if (!other.content)
                  other.content = { type: "tiptap", data: html };
                else other.content.data = html;
                if (other.id !== session.id)
                  useEditorManager
                    .getState()
                    .getEditor(other.id)
                    ?.editor?.updateContent(html);
              }
              deferredSave(session.id, session.id, false, html);
            }}
            onStatisticsChange={(statistics) =>
              useEditorManager
                .getState()
                .updateEditor(session.id, { statistics })
            }
            onHeadingsChange={(tableOfContents) =>
              useEditorManager
                .getState()
                .updateEditor(session.id, { tableOfContents })
            }
            onUndoRedoChange={({ canUndo, canRedo }) =>
              useEditorManager
                .getState()
                .updateEditor(session.id, { canUndo, canRedo })
            }
            onReady={onReady}
            onPreviewDocument={(hash) =>
              useEditorStore.setState({ documentPreview: { hash } })
            }
          />
        </Flex>
      </ScrollContainer>
    </Flex>
  );
}

function DownloadAttachmentProgress(props: { hash: string }) {
  const { hash } = props;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const event = AppEventManager.subscribe(
      AppEvents.UPDATE_ATTACHMENT_PROGRESS,
      (update: { hash: string; loaded: number; total: number }) => {
        if (update.hash === hash)
          setProgress(Math.round((update.loaded / update.total) * 100));
      }
    );
    return () => {
      event.unsubscribe();
    };
  }, [hash]);

  return (
    <Flex
      sx={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column"
      }}
    >
      <Text variant="title">
        {strings.downloadingAttachments()} ({progress}%)
      </Text>
      <Progress value={progress} max={100} sx={{ width: "35%", mt: 1 }} />
      <Button
        variant="secondary"
        sx={{ mt: 2 }}
        onPress={() => {
          const note = useEditorStore.getState().getActiveNote();
          useEditorStore.setState({ documentPreview: undefined });
          if (note) db.fs().cancel(note.id).catch(console.error);
        }}
      >
        <Text>{strings.cancel()}</Text>
      </Button>
    </Flex>
  );
}

function UnlockNoteView(props: {
  session: Extract<
    ReturnType<typeof useEditorStore.getState>["sessions"][number],
    { type: "locked" }
  >;
}) {
  const { session } = props;
  return (
    <Flex
      testID="unlock-note-view"
      sx={{ overflow: "hidden", alignItems: "center", flex: 1 }}
    >
      <UnlockView
        buttonTitle={strings.openNote()}
        subtitle={strings.enterPasswordToUnlockNote()}
        title={session.note.title}
        unlock={async (password) => {
          const note = await db.vault.open(session.note.id, password);
          if (!note || !note.content)
            throw new Error("note with this id does not exist.");
          const tags = await db.notes.tags(note.id);
          useEditorStore.getState().addSession({
            type: session.note.readonly ? "readonly" : "default",
            locked: true,
            id: session.id,
            note: session.note,
            saveState: SaveState.Saved,
            sessionId: `${Date.now()}`,
            tags,
            tabId: session.tabId,
            content: note.content
          });
        }}
      />
    </Flex>
  );
}
