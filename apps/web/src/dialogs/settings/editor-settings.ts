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
import { isMac } from "../../utils/platform";
import { EDITOR_LINE_HEIGHT } from "../../components/editor/common";
import {
  ArrowsVertical,
  DoubleSpacedLines,
  FileMagnifyingGlass,
  GlobeSimple,
  List,
  Markdown,
  NotebookText,
  TextAa,
  TextAlignLeft,
  TextT,
  Wrench
} from "../../components/icons";

export const EditorSettings: SettingsGroup[] = [
  {
    key: "editor",
    section: "editor",
    header: strings.editor(),
    settings: [
      {
        key: "default-title",
        icon: TextAlignLeft,
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
        icon: TextAa,
        description: strings.defaultFontFamilyDesc(),
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
        icon: TextT,
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
        key: "line-height",
        icon: ArrowsVertical,
        title: strings.lineHeight(),
        description: strings.lineHeightDesc(),
        onStateChange: (listener) =>
          onEditorConfigChange((c) => c.lineHeight, listener),
        components: [
          {
            type: "input",
            inputType: "number",
            max: EDITOR_LINE_HEIGHT.MAX,
            min: EDITOR_LINE_HEIGHT.MIN,
            defaultValue: () => editorConfig().lineHeight,
            onChange: (value) =>
              useEditorManager.getState().setEditorConfig({ lineHeight: value })
          }
        ]
      },
      {
        key: "double-spacing",
        icon: DoubleSpacedLines,
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
        icon: Markdown,
        title: strings.mardownShortcuts(),
        description: strings.mardownShortcutsDesc(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((c) => c.markdownShortcuts, listener),
        featureId: "markdownShortcuts",
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().markdownShortcuts,
            toggle: () => useSettingStore.getState().toggleMarkdownShortcuts()
          }
        ]
      },
      {
        key: "font-ligatures",
        icon: List,
        title: strings.fontLigatures(),
        description: strings.fontLigaturesDesc(),
        onStateChange: (listener) =>
          useSettingStore.subscribe((c) => c.fontLigatures, listener),
        featureId: "fontLigatures",
        components: [
          {
            type: "toggle",
            isToggled: () => useSettingStore.getState().fontLigatures,
            toggle: () => useSettingStore.getState().toggleFontLigatures()
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
        icon: FileMagnifyingGlass,
        title: strings.enableSpellChecker(),
        description: "Check spelling as you type while writing your notes",
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
        icon: GlobeSimple,
        title: strings.languages(),
        description: strings.spellCheckerLanguagesDescription(),
        isHidden: () => !useSpellChecker.getState().enabled || isMac(),
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
        icon: NotebookText,
        title: strings.customDictionaryWords(),
        description: () =>
          strings.customDictWords(useSpellChecker.getState().words.length),
        onStateChange: (listener) =>
          useSpellChecker.subscribe((c) => c.words, listener),
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
        icon: Wrench,
        description: strings.customizeToolbarDesc(),
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
