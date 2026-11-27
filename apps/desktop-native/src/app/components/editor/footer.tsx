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

import { Flex, Text } from "@notesnook/ui-kit";
import { StatusBarItem } from "../status-bar/status-bar-item";
import { SaveState, useEditorStore } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import {
  Loading,
  Plus,
  Minus,
  SidebarSimple,
  EditorMargins,
  CornersIn,
  CornersOut,
  Eyeglasses,
  EyeglassesEmpty,
  Checks,
  Asterisk
} from "../icons";
import {
  useEditorConfig,
  useEditorManager,
  useNoteStatistics
} from "./manager";
import { getFormattedDate } from "@notesnook/common";
import { MAX_AUTO_SAVEABLE_WORDS, NoteStatistics } from "./types";
import { strings } from "@notesnook/intl";
import { EDITOR_ZOOM } from "./common";
import { useWindowControls } from "../../hooks/use-window-controls";
import { enterFullscreen, exitFullscreen } from "../../utils/fullscreen";
import { Fragment, useMemo, useRef, useState } from "react";
import { getNoteStatistics } from "../../utils/note-statistics";
import { Box, PopupPresenter } from "@notesnook/ui-kit";
import { saveContent } from "./index";

const SAVE_STATE_ICON_MAP = {
  "-1": Asterisk,
  0: Loading,
  1: Checks
};

function EditorFooterSeparator() {
  return (
    <Box
      sx={{
        width: "1px",
        height: "10px",
        bg: "separator",
        mx: "spacing4"
      }}
    />
  );
}

function EditorFooter() {
  const { isFullscreen } = useWindowControls();
  const reported = useNoteStatistics();
  // Until the native editor reports (it queries on load), count the stored
  // note, so a reopened long note shows its words and auto-save notice at once.
  const stored = useEditorStore((store) => {
    const session = store.getActiveSession();
    const data =
      session && "content" in session ? session.content?.data : undefined;
    return typeof data === "string" ? data : undefined;
  });
  const hasReported = useEditorManager((store) =>
    store.activeEditorId
      ? !!store.editors[store.activeEditorId]?.statistics
      : false
  );
  const statistics = useMemo(
    () => (hasReported ? reported : getNoteStatistics(stored)),
    [hasReported, reported, stored]
  );
  const session = useEditorStore((store) => store.getActiveSession());
  const { editorConfig, setEditorConfig } = useEditorConfig();
  const editorMargins = useEditorStore((store) => store.editorMargins);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const [isStatisticsPopupOpen, setIsStatisticsPopupOpen] = useState(false);
  const statisticsRef = useRef<HTMLButtonElement | null>(null);

  if (!session) return null;

  const saveState =
    session.type === "default" ? session.saveState : SaveState.NotSaved;
  const dateEdited = "note" in session ? session.note.dateEdited : 0;
  const SaveStateIcon = SAVE_STATE_ICON_MAP[saveState];
  const tools = [
    {
      title: editorMargins
        ? strings.disableEditorMargins()
        : strings.enableEditorMargins(),
      icon: editorMargins ? EditorMargins : SidebarSimple,
      enabled: true,
      hideOnMobile: true,
      onClick: () => useEditorStore.getState().toggleEditorMargins()
    },
    {
      title: isFullscreen
        ? strings.exitFullScreen()
        : strings.enterFullScreen(),
      icon: isFullscreen ? CornersIn : CornersOut,
      enabled: true,
      hidden: !isFocusMode,
      hideOnMobile: true,
      onClick: () => {
        if (isFullscreen) {
          exitFullscreen();
        } else {
          enterFullscreen();
        }
      }
    },
    {
      title: isFocusMode ? strings.normalMode() : strings.focusMode(),
      icon: isFocusMode ? EyeglassesEmpty : Eyeglasses,
      enabled: true,
      hideOnMobile: true,
      onClick: () => useAppStore.getState().toggleFocusMode()
    }
  ];

  return (
    <Flex sx={{ alignItems: "center", justifyContent: "center" }}>
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          height: "100%"
        }}
      >
        {tools
          .filter((tool) => !tool.hidden)
          .map((tool) => (
            <Fragment key={tool.title}>
              <StatusBarItem
                variant="button"
                data-test-id={tool.title}
                disabled={!tool.enabled}
                title={tool.title}
                onClick={tool.onClick}
                sx={{ display: tool.hidden ? "none" : "flex" }}
                icon={tool.icon}
              />
              {!tool.hidden && <EditorFooterSeparator />}
            </Fragment>
          ))}
        <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
          <StatusBarItem
            variant="button"
            data-test-id="editor-zoom-out"
            icon={Minus}
            onClick={() =>
              setEditorConfig({
                zoom: Math.max(
                  EDITOR_ZOOM.MIN,
                  editorConfig.zoom - EDITOR_ZOOM.STEP
                )
              })
            }
            disabled={editorConfig.zoom <= EDITOR_ZOOM.MIN}
          />
          <StatusBarItem
            variant="button"
            data-test-id="editor-zoom"
            title={strings.clickToReset(strings.zoom().toLocaleLowerCase())}
            onClick={() => setEditorConfig({ zoom: EDITOR_ZOOM.DEFAULT })}
            sx={{ width: "34px" }}
            text={`${editorConfig.zoom}%`}
          />
          <StatusBarItem
            variant="button"
            data-test-id="editor-zoom-in"
            icon={Plus}
            onClick={() =>
              setEditorConfig({
                zoom: Math.min(
                  EDITOR_ZOOM.MAX,
                  editorConfig.zoom + EDITOR_ZOOM.STEP
                )
              })
            }
            disabled={editorConfig.zoom >= EDITOR_ZOOM.MAX}
          />
        </Flex>
      </Flex>
      <EditorFooterSeparator />
      {statistics.words.total > MAX_AUTO_SAVEABLE_WORDS ? (
        <>
          <StatusBarItem
            variant="text"
            className="selectable"
            text={strings.autoSaveOff()}
          />
          <EditorFooterSeparator />
        </>
      ) : null}
      <StatusBarItem
        variant="button"
        className="selectable"
        data-test-id="editor-word-count"
        ref={statisticsRef}
        onClick={() => setIsStatisticsPopupOpen(true)}
        text={`${strings.totalWords(statistics.words.total)}${
          statistics.words.selected
            ? ` (${strings.selectedWords(statistics.words.selected)})`
            : ""
        }`}
      />
      <PopupPresenter
        isOpen={isStatisticsPopupOpen}
        onClose={() => setIsStatisticsPopupOpen(false)}
        position={{
          isTargetAbsolute: true,
          target: statisticsRef.current,
          location: "top",
          align: "center",
          yOffset: 11
        }}
      >
        <Flex
          sx={{
            minWidth: "120px",
            border: "1px solid",
            borderColor: "border-secondary",
            borderRadius: "radius2",
            boxShadow: "menu",
            bg: "background",
            flexDirection: "column",
            py: "spacing2",
            justifyContent: "center"
          }}
        >
          {Object.entries(statistics).map(([key, value]) => (
            <Flex
              key={key}
              data-test-id={`editor-statistics-${key}`}
              sx={{
                justifyContent: "space-between",
                gap: "spacing4",
                px: "spacing4",
                py: "spacing3"
              }}
            >
              <Text sx={{ fontSize: "xxs", color: "paragraph" }}>
                {strings[key as keyof NoteStatistics]()}
              </Text>
              <Text sx={{ color: "paragraph", fontSize: "xxs" }}>
                {value.total}
                {value.selected ? (
                  <Text as="span">
                    {" "}
                    ({strings.selectedWords(value.selected)})
                  </Text>
                ) : (
                  ""
                )}
              </Text>
            </Flex>
          ))}
        </Flex>
      </PopupPresenter>
      <EditorFooterSeparator />
      {dateEdited > 0 ? (
        <>
          <StatusBarItem
            variant="text"
            className="selectable"
            data-test-id="editor-date-edited"
            title={dateEdited.toString()}
            text={getFormattedDate(dateEdited)}
          />
          <EditorFooterSeparator />
        </>
      ) : null}
      {SaveStateIcon && (
        <StatusBarItem
          variant="button"
          icon={SaveStateIcon}
          data-test-id={`editor-save-state-${
            saveState === SaveState.Saved
              ? "saved"
              : saveState === SaveState.NotSaved
              ? "notsaved"
              : "loading"
          }`}
          iconProps={{
            color:
              saveState === SaveState.Saved
                ? "accent"
                : saveState === SaveState.NotSaved
                ? "icon-error"
                : "icon"
          }}
          title={
            saveState === SaveState.NotSaved ? strings.clickToSave() : undefined
          }
          sx={{
            cursor: saveState === SaveState.NotSaved ? "pointer" : "default",
            ":hover": {
              bg: saveState === SaveState.NotSaved ? "hover" : "transparent"
            }
          }}
          onClick={() => {
            if (saveState === SaveState.NotSaved) {
              const { activeEditorId, getEditor } = useEditorManager.getState();
              const editor = getEditor(activeEditorId || "")?.editor;
              if (!editor) return;
              saveContent(session.id, false, editor.getContent());
            }
          }}
        />
      )}
    </Flex>
  );
}
export default EditorFooter;
