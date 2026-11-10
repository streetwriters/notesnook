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

import { useMemo, useRef, useState } from "react";
import { getFormattedDate } from "@notesnook/common";
import { strings } from "@notesnook/intl";
import { Box, Flex, Popover, Text, type UIElement } from "@ui";
import { StatusBarItem } from "../status-bar/status-bar-item";
import { SaveState, useEditorStore } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import {
  Asterisk,
  Checks,
  CornersIn,
  CornersOut,
  EditorMargins,
  Eyeglasses,
  EyeglassesEmpty,
  Loading,
  Minus,
  Plus,
  SidebarSimple
} from "../icons";
import {
  useEditorConfig,
  useEditorManager,
  type NoteStatistics
} from "./manager";
import { EDITOR_ZOOM, MAX_AUTO_SAVEABLE_WORDS } from "./common";
import { saveContent } from "./save-content";
import { useWindowControls } from "../../hooks/use-window-controls";
import { getNoteStatistics } from "../../utils/note-statistics";
import { windowControls } from "@platform";

const SAVE_STATE_ICON_MAP = {
  "-1": Asterisk,
  0: Loading,
  1: Checks
};

function EditorFooterSeparator() {
  return <Box sx={{ width: 1, height: 10, bg: "separator", mx: "spacing4" }} />;
}

function useStatistics(): NoteStatistics {
  const live = useEditorManager((store) =>
    store.activeEditorId
      ? store.editors[store.activeEditorId]?.statistics
      : undefined
  );
  const data = useEditorStore((store) => {
    const session = store.getActiveSession();
    const data =
      session && "content" in session ? session.content?.data : undefined;
    return typeof data === "string" ? data : undefined;
  });
  const stored = useMemo(() => getNoteStatistics(data), [data]);
  return live ?? stored;
}

export default function EditorFooter() {
  const { isFullscreen } = useWindowControls();
  const statistics = useStatistics();
  const session = useEditorStore((store) => store.getActiveSession());
  const { editorConfig, setEditorConfig } = useEditorConfig();
  const editorMargins = useEditorStore((store) => store.editorMargins);
  const isFocusMode = useAppStore((store) => store.isFocusMode);
  const [isStatisticsPopupOpen, setIsStatisticsPopupOpen] = useState(false);
  const statisticsRef = useRef<UIElement>(null);

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
      hidden: false,
      onPress: () => useEditorStore.getState().toggleEditorMargins()
    },
    {
      title: isFullscreen
        ? strings.exitFullScreen()
        : strings.enterFullScreen(),
      icon: isFullscreen ? CornersIn : CornersOut,
      hidden: !isFocusMode,
      onPress: () =>
        isFullscreen
          ? windowControls.exitFullscreen()
          : windowControls.enterFullscreen()
    },
    {
      title: isFocusMode ? strings.normalMode() : strings.focusMode(),
      icon: isFocusMode ? EyeglassesEmpty : Eyeglasses,
      hidden: false,
      onPress: () => useAppStore.getState().toggleFocusMode()
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
            <Flex key={tool.title} sx={{ alignItems: "center" }}>
              <StatusBarItem
                variant="button"
                testID={tool.title}
                title={tool.title}
                onPress={tool.onPress}
                icon={tool.icon}
              />
              <EditorFooterSeparator />
            </Flex>
          ))}
        <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
          <StatusBarItem
            variant="button"
            testID="editor-zoom-out"
            icon={Minus}
            onPress={() =>
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
            testID="editor-zoom"
            title={strings.clickToReset(strings.zoom().toLocaleLowerCase())}
            onPress={() => setEditorConfig({ zoom: EDITOR_ZOOM.DEFAULT })}
            sx={{ width: 34, px: 0, overflow: "visible" }}
            text={`${editorConfig.zoom}%`}
          />
          <StatusBarItem
            variant="button"
            testID="editor-zoom-in"
            icon={Plus}
            onPress={() =>
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
          <StatusBarItem variant="text" text={strings.autoSaveOff()} />
          <EditorFooterSeparator />
        </>
      ) : null}
      <Flex ref={statisticsRef}>
        <StatusBarItem
          variant="button"
          testID="editor-word-count"
          onPress={() => setIsStatisticsPopupOpen(true)}
          text={`${strings.totalWords(statistics.words.total)}${
            statistics.words.selected
              ? ` (${strings.selectedWords(statistics.words.selected)})`
              : ""
          }`}
        />
      </Flex>
      <Popover
        isOpen={isStatisticsPopupOpen}
        onClose={() => setIsStatisticsPopupOpen(false)}
        anchorRef={statisticsRef}
        placement="top-start"
        sx={{
          minWidth: 120,
          border: "1px solid",
          borderColor: "border-secondary",
          borderRadius: "radius2",
          bg: "background",
          flexDirection: "column",
          py: "spacing2",
          justifyContent: "center"
        }}
      >
        {(Object.keys(statistics) as (keyof NoteStatistics)[]).map((key) => (
          <Flex
            key={key}
            testID={`editor-statistics-${key}`}
            sx={{
              justifyContent: "space-between",
              gap: "spacing4",
              px: "spacing4",
              py: "spacing3"
            }}
          >
            <Text sx={{ fontSize: "xxs", color: "paragraph" }}>
              {strings[key]()}
            </Text>
            <Text sx={{ color: "paragraph", fontSize: "xxs" }}>
              {statistics[key].total}
              {statistics[key].selected
                ? ` (${strings.selectedWords(statistics[key].selected)})`
                : ""}
            </Text>
          </Flex>
        ))}
      </Popover>
      <EditorFooterSeparator />
      {dateEdited > 0 ? (
        <>
          <StatusBarItem
            variant="text"
            testID="editor-date-edited"
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
          testID={`editor-save-state-${
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
          onPress={() => {
            if (saveState !== SaveState.NotSaved) return;
            const { activeEditorId, getEditor } = useEditorManager.getState();
            const editor = getEditor(activeEditorId || "")?.editor;
            if (!editor) return;
            saveContent(session.id, false, editor.getContent());
          }}
        />
      )}
    </Flex>
  );
}
