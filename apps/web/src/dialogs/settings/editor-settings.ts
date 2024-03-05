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

import { SettingsGroup } from "./types";
import {
  editorConfig,
  onEditorConfigChange,
  setEditorConfig
} from "../../components/editor/context";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { getFonts } from "@notesnook/editor";
import { useSpellChecker } from "../../hooks/use-spell-checker";
import { SpellCheckerLanguages } from "./components/spell-checker-languages";

import { CustomizeToolbar } from "./components/customize-toolbar";
import { DictionaryWords } from "./components/dictionary-words";

export const EditorSettings: SettingsGroup[] = [
  {
    key: "editor",
    section: "editor",
    header: "Editor",
    settings: [
      {
        key: "default-title",
        title: "Default title format",
        description: `Use the following key to format the title:

$date$: Current date
$time$: Current time
$count$: Number of notes + 1
$headline$: Use starting line of the note as title
$timestamp$: Full date & time without any spaces or other
symbols (e.g. 202305261253)`,
        onStateChange: (listener) =>
          useSettingStore.subscribe((c) => c.titleFormat, listener),
        components: [
          {
            type: "input",
            inputType: "text",
            defaultValue: () => useSettingStore.getState().titleFormat || "",
            onChange: (value) =>
              useSettingStore.getState().setTitleFormat(value)
          }
        ]
      },
      {
        key: "default-font",
        title: "Default font family",
        onStateChange: (listener) =>
          onEditorConfigChange((c) => c.fontFamily, listener),
        components: [
          {
            type: "dropdown",
            options: getFonts().map((font) => ({
              value: font.id,
              title: font.title
            })),
            selectedOption: () => editorConfig().fontFamily,
            onSelectionChanged: (value) => {
              setEditorConfig({ fontFamily: value });
            }
          }
        ]
      },
      {
        key: "default-font-size",
        title: "Default font size",
        description:
          "Change the default font size used in the editor. Minimum = 8px; Maximum = 120px.",
        onStateChange: (listener) =>
          onEditorConfigChange((c) => c.fontSize, listener),
        components: [
          {
            type: "input",
            inputType: "number",
            max: 120,
            min: 8,
            defaultValue: () => editorConfig().fontSize,
            onChange: (value) => setEditorConfig({ fontSize: value })
          }
        ]
      },
      {
        key: "double-spacing",
        title: "Double spaced paragraphs",
        description:
          "Use double spacing between paragraphs when you press Enter in the editor.",
        onStateChange: (listener) =>
          useSettingStore.subscribe((c) => c.doubleSpacedParagraphs, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().doubleSpacedParagraphs,
            toggle: () =>
              useSettingStore.getState().toggleDoubleSpacedParagraphs()
          }
        ]
      },
      {
        key: "markdown-shortcuts",
        title: "Markdown shortcuts",
        description: `Markdown shortcuts are triggered whenever you input a specific character combination.
        
For example:

1. Typing '/date' adds the current Date
2. Wrapping something in '**' turns it into bold text
3. Typing '1.' automatically creates a numbered list.
4. etc.`,
        onStateChange: (listener) =>
          useSettingStore.subscribe((c) => c.markdownShortcuts, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().markdownShortcuts,
            toggle: () => useSettingStore.getState().toggleMarkdownShortcuts()
          }
        ]
      }
    ]
  },
  {
    key: "spell-check",
    section: "editor",
    header: "Spell check",
    isHidden: () => !IS_DESKTOP_APP,
    onRender: () => {
      useSpellChecker.getState().refresh();
    },
    settings: [
      {
        key: "enable-spellchecker",
        title: "Enable spell checker",
        onStateChange: (listener) =>
          useSpellChecker.subscribe((c) => c.enabled, listener),
        components: [
          {
            type: "toggle",
            isToggled: () => useSpellChecker.getState().enabled,
            toggle: () => useSpellChecker.getState().toggleSpellChecker()
          }
        ]
      },
      {
        key: "spell-checker-languages",
        title: "Languages",
        description: "Select the languages the spell checker should check in.",
        isHidden: () => !useSpellChecker.getState().enabled,
        onStateChange: (listener) =>
          useSpellChecker.subscribe((c) => c.enabled, listener),
        components: [
          {
            type: "custom",
            component: SpellCheckerLanguages
          }
        ]
      },
      {
        key: "custom-dictionay-words",
        title: "Custom dictionary words",
        components: [
          {
            type: "custom",
            component: DictionaryWords
          }
        ]
      }
    ]
  },
  {
    key: "toolbar",
    section: "editor",
    header: "Toolbar",
    settings: [
      {
        key: "customize-toolbar",
        title: "Customize toolbar",
        components: [
          {
            type: "custom",
            component: CustomizeToolbar
          }
        ]
      }
    ]
  }
];
