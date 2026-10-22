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

import { Flex, Text } from "@notesnook/ui";
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
import { exitFullscreen } from "../../utils/fullscreen";
import { useRef, useState } from "react";
import { Box, PopupPresenter } from "@notesnook/ui";
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
  const statistics = useNoteStatistics();
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
          enterFullscreen(document.documentElement);
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
        {tools.map((tool) => (
          <>
            <StatusBarItem
              variant="button"
              data-test-id={tool.title}
              disabled={!tool.enabled}
              title={tool.title}
              key={tool.title}
              onClick={tool.onClick}
              sx={{ display: tool.hidden ? "none" : "flex" }}
              icon={tool.icon}
            />
            {!tool.hidden && <EditorFooterSeparator />}
          </>
        ))}
        <Flex sx={{ alignItems: "center", gap: "spacing3" }}>
          <StatusBarItem
            variant="button"
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
            title={strings.clickToReset(strings.zoom().toLocaleLowerCase())}
            onClick={() => setEditorConfig({ zoom: EDITOR_ZOOM.DEFAULT })}
            sx={{ width: "34px" }}
            text={`${editorConfig.zoom}%`}
          />
          <StatusBarItem
            variant="button"
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
            width: ["100%", "fit-content"],
            minWidth: "120px",
            border: "1px solid",
            borderColor: "border-secondary",
            borderRadius: "radius2",
            boxShadow: "0 4px 25px 0 rgba(0, 0, 0, 0.05)",
            bg: "background",
            flexDirection: "column",
            py: "spacing2",
            justifyContent: "center"
          }}
        >
          {Object.entries(statistics).map(([key, value]) => (
            <Flex
              key={key}
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
                  <span> ({value.selected} selected)</span>
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
        <StatusBarItem
          variant="text"
          className="selectable"
          data-test-id="editor-date-edited"
          title={dateEdited.toString()}
          text={getFormattedDate(dateEdited)}
        />
      ) : null}
      <EditorFooterSeparator />
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
              bg:
                saveState === SaveState.NotSaved
                  ? "hover"
                  : "initial !important"
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

function enterFullscreen(elem: HTMLElement) {
  elem.requestFullscreen();
}
