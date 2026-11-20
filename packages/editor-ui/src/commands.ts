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

type AnyCommand<ReturnType> = (...args: any[]) => ReturnType;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    editorUiCommands: {
      addColumnAfter: AnyCommand<ReturnType>;
      addColumnBefore: AnyCommand<ReturnType>;
      addRowAfter: AnyCommand<ReturnType>;
      addRowBefore: AnyCommand<ReturnType>;
      deleteColumn: AnyCommand<ReturnType>;
      deleteRow: AnyCommand<ReturnType>;
      deleteTable: AnyCommand<ReturnType>;
      endSearch: AnyCommand<ReturnType>;
      exportTableAsCsv: AnyCommand<ReturnType>;
      importCsvToTable: AnyCommand<ReturnType>;
      insertAttachment: AnyCommand<ReturnType>;
      insertEmbed: AnyCommand<ReturnType>;
      insertImage: AnyCommand<ReturnType>;
      insertMathBlock: AnyCommand<ReturnType>;
      insertMathInline: AnyCommand<ReturnType>;
      insertTable: AnyCommand<ReturnType>;
      mergeCells: AnyCommand<ReturnType>;
      moveToNextResult: AnyCommand<ReturnType>;
      moveToPreviousResult: AnyCommand<ReturnType>;
      removeAttachment: AnyCommand<ReturnType>;
      replace: AnyCommand<ReturnType>;
      replaceAll: AnyCommand<ReturnType>;
      search: AnyCommand<ReturnType>;
      setCallout: AnyCommand<ReturnType>;
      setCellAttribute: AnyCommand<ReturnType>;
      setColor: AnyCommand<ReturnType>;
      setEmbedAlignment: AnyCommand<ReturnType>;
      setEmbedSize: AnyCommand<ReturnType>;
      setEmbedSource: AnyCommand<ReturnType>;
      setFontFamily: AnyCommand<ReturnType>;
      setFontSize: AnyCommand<ReturnType>;
      setHeading: AnyCommand<ReturnType>;
      setHighlight: AnyCommand<ReturnType>;
      setHorizontalRule: AnyCommand<ReturnType>;
      setImageAlignment: AnyCommand<ReturnType>;
      setImageSize: AnyCommand<ReturnType>;
      setLink: AnyCommand<ReturnType>;
      setParagraph: AnyCommand<ReturnType>;
      setTextAlign: AnyCommand<ReturnType>;
      setTextDirection: AnyCommand<ReturnType>;
      splitCell: AnyCommand<ReturnType>;
      toggleBlockquote: AnyCommand<ReturnType>;
      toggleBold: AnyCommand<ReturnType>;
      toggleBulletList: AnyCommand<ReturnType>;
      toggleCheckList: AnyCommand<ReturnType>;
      toggleCode: AnyCommand<ReturnType>;
      toggleCodeBlock: AnyCommand<ReturnType>;
      toggleItalic: AnyCommand<ReturnType>;
      toggleLink: AnyCommand<ReturnType>;
      toggleOrderedList: AnyCommand<ReturnType>;
      toggleOutlineList: AnyCommand<ReturnType>;
      toggleStrike: AnyCommand<ReturnType>;
      toggleSubscript: AnyCommand<ReturnType>;
      toggleSuperscript: AnyCommand<ReturnType>;
      toggleTaskList: AnyCommand<ReturnType>;
      toggleUnderline: AnyCommand<ReturnType>;
      unsetColor: AnyCommand<ReturnType>;
      unsetHighlight: AnyCommand<ReturnType>;
      unsetLink: AnyCommand<ReturnType>;
    };
  }
}

declare global {
  // eslint-disable-next-line no-var
  var keyboardShown: boolean;
}

export {};
