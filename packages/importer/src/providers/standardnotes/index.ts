import hljs from "highlight.js";
import showdown from "showdown";
import { Content, ContentType, Note } from "../../models/note";
import { File } from "../../utils/file";
import {
  IFileProvider,
  iterate,
  ProviderResult,
  ProviderSettings,
} from "../provider";
import {
  SNNote,
  SNComponent,
  SNTag,
  SNBackup,
  ProtocolVersion,
  ContentType as SNItemType,
  DefaultAppDomain,
  ComponentDataDomain,
  ComponentArea,
  EditorDescription,
  NoteType,
  CodeEditorComponentData,
  Spreadsheet,
} from "./types";
import { buildCodeblock, buildTable, Cell, Row } from "../../utils/domutils";

const converter = new showdown.Converter();
converter.setFlavor("github");
const defaultEditorDescription = (item: SNNote): EditorDescription => {
  const isHtml =
    item.content.text.includes("<") && item.content.text.includes("</");
  return {
    file_type: isHtml ? "html" : "txt",
    note_type: isHtml ? NoteType.RichText : NoteType.Markdown,
  };
};

export class StandardNotes implements IFileProvider {
  public type: "file" = "file";
  public supportedExtensions = [".txt"];
  public validExtensions = [...this.supportedExtensions];
  public version = "1.0.0";
  public name = "Standard Notes";

  async process(
    files: File[],
    _settings: ProviderSettings
  ): Promise<ProviderResult> {
    return iterate(this, files, async (file, notes, errors) => {
      if (file.name !== "Standard Notes Backup and Import File.txt")
        return false;

      let data: SNBackup = <SNBackup>JSON.parse(file.text);
      if (!data.items) {
        errors.push(new Error("Invalid backup file."));
        return false;
      }

      if (data.version !== ProtocolVersion.V004) {
        errors.push(
          new Error(`Unsupported backup file version: ${data.version}.`)
        );
        return false;
      }

      const components: SNComponent[] = [];
      const tags: SNTag[] = [];
      const snnotes: SNNote[] = [];

      data.items.forEach((item) => {
        switch (item.content_type) {
          case SNItemType.Note:
            snnotes.push(<SNNote>item);
          case SNItemType.Component:
            components.push(<SNComponent>item);
            break;
          case SNItemType.Tag:
            tags.push(<SNTag>item);
        }
      });

      for (let item of snnotes) {
        const { createdAt, updatedAt } = this.getTimestamps(item);
        let note: Note = {
          title: item.content.title,
          dateCreated: createdAt,
          dateEdited: updatedAt,
          pinned: <boolean>item.content.appData[DefaultAppDomain]?.pinned,
          tags: this.getTags(item, tags),
          content: this.parseContent(item, components),
        };
        notes.push(note);
      }

      return true;
    });
  }

  getEditor(item: SNNote, components: SNComponent[]): EditorDescription {
    let componentData = item.content.appData[ComponentDataDomain] || {};
    let componentId = Object.keys(componentData).pop();
    if (!componentId) return defaultEditorDescription(item);

    let component = components.find(
      (c) =>
        c.uuid === componentId &&
        (c.content.area === ComponentArea.Editor ||
          c.content.area === ComponentArea.EditorStack)
    );
    if (!component) return defaultEditorDescription(item);
    const editor = <EditorDescription>component.content.package_info;
    if (
      editor.note_type === NoteType.Code &&
      Boolean(componentData[componentId])
    ) {
      editor.language = (<CodeEditorComponentData>(
        componentData[componentId]
      )).mode;
    }
    return editor;
  }

  getTags(item: SNNote, tags: SNTag[]): string[] {
    if (!item.content.references || !item.content.references.length) return [];

    let noteTags: string[] = [];
    for (let reference of item.content.references) {
      let tag = tags.find((tag) => tag.uuid === reference.uuid);
      if (!tag) continue;
      noteTags.push(tag.content.title);
    }
    return noteTags;
  }

  /**
   * Find object in array with maximum index
   * @param array
   * @returns
   */
  maxIndexItem<T extends { index?: number }>(array: T[]): T {
    return array.sort((a, b) => (b.index || 0) - (a.index || 0))[0];
  }

  parseContent(item: SNNote, components: SNComponent[]): Content {
    let editor = this.getEditor(item, components);

    const data = item.content.text;
    switch (editor.note_type) {
      case NoteType.RichText:
        return {
          data: data,
          type: ContentType.HTML,
        };
      case NoteType.Code: {
        let language = editor.language || "plaintext";
        if (language === "htmlmixed") language = "html";
        else if (language === "markdown")
          return { type: ContentType.HTML, data: converter.makeHtml(data) };

        let code = hljs.highlightAuto(data, [language]);
        let html = buildCodeblock(code.value, language);
        return {
          type: ContentType.HTML,
          data: html,
        };
      }
      case NoteType.Spreadsheet: {
        let spreadsheet = <Spreadsheet>JSON.parse(data);
        let html = ``;

        for (let sheet of spreadsheet.sheets) {
          if (!sheet.rows || sheet.rows.length === 0) continue;

          let lastCell = this.maxIndexItem(
            sheet.rows.map((row) => this.maxIndexItem(row.cells || []))
          );
          let lastRow = this.maxIndexItem(sheet.rows);
          let [maxColumns, maxRows] = [lastCell.index || 0, lastRow.index || 0];

          let rows: Row[] = [];
          for (let i = 0; i <= maxRows; i++) {
            let row = sheet.rows.find(({ index }) => index === i);
            let cells: Cell[] = [];

            for (let col = 0; col <= maxColumns; col++) {
              let cell = row?.cells?.find(({ index }) => index === col);
              cells.push({ type: "td", value: cell?.value?.toString() || "" });
            }
            rows.push({ cells });
          }

          html += buildTable(rows);
        }
        return {
          type: ContentType.HTML,
          data: html,
        };
      }
      case NoteType.Authentication: {
        let tokens = <any[]>JSON.parse(data);
        let html = tokens
          .map((token) =>
            buildTable(
              Object.keys(token).map((key) => ({
                cells: [
                  { type: "th", value: key },
                  { type: "td", value: token[key] },
                ],
              }))
            )
          )
          .join("\n");
        return {
          data: html,
          type: ContentType.HTML,
        };
      }
      case NoteType.Task:
      case NoteType.Markdown:
      default:
        return {
          data: converter.makeHtml(data),
          type: ContentType.HTML,
        };
    }
  }

  private getTimestamps(note: SNNote) {
    let createdAt =
      typeof note.created_at === "string"
        ? new Date(note.created_at).getTime()
        : note.created_at_timestamp
        ? note.created_at_timestamp / 1000
        : undefined;
    let updatedAt =
      typeof note.updated_at === "string"
        ? new Date(note.updated_at).getTime()
        : note.updated_at_timestamp
        ? note.updated_at_timestamp / 1000
        : undefined;

    if (updatedAt === 0) updatedAt = undefined;
    if (createdAt === 0) createdAt = undefined;
    return { createdAt, updatedAt };
  }
}
