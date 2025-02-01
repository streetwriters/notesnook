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

import { Button, Flex, Text } from "@theme-ui/components";
import { SaveState, useEditorStore } from "../../stores/editor-store";
import { useStore as useAppStore } from "../../stores/app-store";
import {
  Loading,
  Saved,
  NotSaved,
  FocusMode,
  Plus,
  Minus,
  EditorNormalWidth,
  TableOfContents,
  ExitFullscreen,
  Fullscreen,
  EditorFullWidth,
  NormalMode
} from "../icons";
import {
  useEditorConfig,
  useNoteStatistics,
  useEditorManager
} from "./manager";
import { getFormattedDate } from "@notesnook/common";
import { MAX_AUTO_SAVEABLE_WORDS } from "./types";
import { strings } from "@notesnook/intl";
import { EDITOR_ZOOM } from "./common";
import { useWindowControls } from "../../hooks/use-window-controls";

const SAVE_STATE_ICON_MAP = {
  "-1": NotSaved,
  0: Loading,
  1: Saved
};

function EditorFooter() {
  const { isFullscreen } = useWindowControls();
  const { words } = useNoteStatistics();
  const session = useEditorStore((store) => store.getActiveSession());
  const { editorConfig, setEditorConfig } = useEditorConfig();
  const editorMargins = useEditorStore((store) => store.editorMargins);
  const isFocusMode = useAppStore((store) => store.isFocusMode);

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
      icon: editorMargins ? EditorNormalWidth : EditorFullWidth,
      enabled: true,
      hideOnMobile: true,
      onClick: () => useEditorStore.getState().toggleEditorMargins()
    },
    {
      title: isFullscreen
        ? strings.exitFullScreen()
        : strings.enterFullScreen(),
      icon: isFullscreen ? ExitFullscreen : Fullscreen,
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
      icon: isFocusMode ? FocusMode : NormalMode,
      enabled: true,
      hideOnMobile: true,
      onClick: () => {
        useAppStore.getState().toggleFocusMode();
        if (document.fullscreenElement) exitFullscreen();
        const editor =
          session && useEditorManager.getState().getEditor(session.id);
        if (editor) editor.editor?.focus();
      }
    }
  ];

  return (
    <Flex sx={{ alignItems: "center", justifyContent: "center", gap: 2 }}>
      <Flex
        sx={{
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          height: "100%"
        }}
      >
        {tools.map((tool) => (
          <Button
            data-test-id={tool.title}
            disabled={!tool.enabled}
            title={tool.title}
            key={tool.title}
            onClick={tool.onClick}
            sx={{
              py: 0,
              px: 1,
              height: "100%",
              display: tool.hidden ? "none" : "block"
            }}
            variant="icon"
          >
            <tool.icon size={13} />
          </Button>
        ))}
        <Button
          variant="icon"
          onClick={() =>
            setEditorConfig({
              zoom: Math.max(
                EDITOR_ZOOM.MIN,
                editorConfig.zoom - EDITOR_ZOOM.STEP
              )
            })
          }
          disabled={editorConfig.zoom <= EDITOR_ZOOM.MIN}
          sx={{ py: 0, px: 1, height: "100%" }}
        >
          <Minus size={13} />
        </Button>
        <Text variant="subBody" sx={{ color: "paragraph" }}>
          {editorConfig.zoom}%
        </Text>
        <Button
          variant="icon"
          onClick={() =>
            setEditorConfig({
              zoom: Math.min(
                EDITOR_ZOOM.MAX,
                editorConfig.zoom + EDITOR_ZOOM.STEP
              )
            })
          }
          disabled={editorConfig.zoom >= EDITOR_ZOOM.MAX}
          sx={{ py: 0, px: 1, height: "100%" }}
        >
          <Plus size={13} />
        </Button>
      </Flex>
      {words.total > MAX_AUTO_SAVEABLE_WORDS ? (
        <Text
          className="selectable"
          variant="subBody"
          sx={{ color: "paragraph" }}
        >
          {strings.autoSaveOff()}
        </Text>
      ) : null}
      <Text
        className="selectable"
        data-test-id="editor-word-count"
        variant="subBody"
        sx={{ color: "paragraph" }}
      >
        {strings.totalWords(words.total)}
        {words.selected ? ` (${strings.selectedWords(words.selected)})` : ""}
      </Text>
      {dateEdited > 0 ? (
        <Text
          className="selectable"
          variant="subBody"
          sx={{ color: "paragraph" }}
          data-test-id="editor-date-edited"
          title={dateEdited.toString()}
        >
          {getFormattedDate(dateEdited)}
        </Text>
      ) : null}
      {SaveStateIcon && (
        <SaveStateIcon
          data-test-id={`editor-save-state-${
            saveState === SaveState.Saved
              ? "saved"
              : saveState === SaveState.NotSaved
              ? "notsaved"
              : "loading"
          }`}
          size={13}
          color={
            saveState === SaveState.Saved
              ? "accent"
              : saveState === SaveState.NotSaved
              ? "icon-error"
              : "paragraph"
          }
        />
      )}
    </Flex>
  );
}
export default EditorFooter;

function enterFullscreen(elem: HTMLElement) {
  elem.requestFullscreen();
}

function exitFullscreen() {
  if (!document.fullscreenElement) return;
  document.exitFullscreen();
}
