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
  useEditorManager
} from "../../components/editor/manager";
import { useStore as useSettingStore } from "../../stores/setting-store";
import { getFonts } from "@notesnook/editor";
import { useSpellChecker } from "../../hooks/use-spell-checker";
import { SpellCheckerLanguages } from "./components/spell-checker-languages";

import { CustomizeToolbar } from "./components/customize-toolbar";
import { DictionaryWords } from "./components/dictionary-words";
import { strings } from "@notesnook/intl";

export const EditorSettings: SettingsGroup[] = [
  {
    key: "editor",
    section: "editor",
    header: strings.editor(),
    settings: [
      {
        key: "default-title",
        title: strings.titleFormat(),
        description: strings.titleFormatDesc(),
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
        title: strings.defaultFontFamily(),
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
              useEditorManager
                .getState()
                .setEditorConfig({ fontFamily: value });
            }
          }
        ]
      },
      {
        key: "default-font-size",
        title: strings.defaultFontSize(),
        description: strings.defaultFontSizeDesc(),
        onStateChange: (listener) =>
          onEditorConfigChange((c) => c.fontSize, listener),
        components: [
          {
            type: "input",
            inputType: "number",
            max: 120,
            min: 8,
            defaultValue: () => editorConfig().fontSize,
            onChange: (value) =>
              useEditorManager.getState().setEditorConfig({ fontSize: value })
          }
        ]
      },
      {
        key: "double-spacing",
        title: strings.doubleSpacedLines(),
        description: strings.doubleSpacedLinesDesc(),
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
        title: strings.mardownShortcuts(),
        description: strings.mardownShortcutsDesc(),
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
    header: strings.spellCheck(),
    isHidden: () => !IS_DESKTOP_APP,
    onRender: () => {
      useSpellChecker.getState().refresh();
    },
    settings: [
      {
        key: "enable-spellchecker",
        title: strings.enableSpellChecker(),
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
        title: strings.languages(),
        description: strings.spellCheckerLanguagesDescription(),
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
        title: strings.customDictionaryWords(),
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
    header: strings.toolbar(),
    settings: [
      {
        key: "customize-toolbar",
        title: strings.customizeToolbar(),
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
