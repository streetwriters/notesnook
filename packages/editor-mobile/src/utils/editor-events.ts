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

export const EditorEvents = {
  selection: "editor-event:selection",
  content: "editor-event:content",
  title: "editor-event:title",
  scroll: "editor-event:scroll",
  history: "editor-event:history",
  newtag: "editor-event:newtag",
  tag: "editor-event:tag",
  filepicker: "editor-event:picker",
  download: "editor-event:download-attachment",
  logger: "native:logger",
  back: "editor-event:back",
  pro: "editor-event:pro",
  monograph: "editor-event:monograph",
  properties: "editor-event:properties",
  fullscreen: "editor-event:fullscreen",
  link: "editor-event:link",
  contentchange: "editor-event:content-change",
  reminders: "editor-event:reminders",
  previewAttachment: "editor-event:preview-attachment",
  copyToClipboard: "editor-events:copy-to-clipboard",
  getAttachmentData: "editor-events:get-attachment-data",
  tabsChanged: "editor-events:tabs-changed",
  showTabs: "editor-events:show-tabs",
  tabFocused: "editor-events:tab-focused",
  toc: "editor-events:toc",
  createInternalLink: "editor-events:create-internal-link",
  load: "editor-events:load",
  unlock: "editor-events:unlock",
  unlockWithBiometrics: "editor-events:unlock-biometrics",
  disableReadonlyMode: "editor-events:disable-readonly-mode",
  readonlyEditorLoaded: "readonlyEditorLoaded",
  error: "editorError",
  dbLogger: "editor-events:dbLogger",
  goBack: "editor-events:go-back",
  goForward: "editor-events:go-forward",
  saveScroll: "editor-events:save-scroll",
  newNote: "editor-events:new-note"
} as const;
