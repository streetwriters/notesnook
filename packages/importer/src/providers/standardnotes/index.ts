import hljs from "highlight.js";
import showdown from "showdown";
import { Content, ContentType, Note } from "../../models/note";
import { File } from "../../utils/file";
import {
  IProvider,
  iterate,
  ProviderResult,
  ProviderSettings,
} from "../provider";
import {
  BackupType,
  editors,
  EditorType,
  SpreadSheet,
  StandardnotesNote,
  TokenVaultItem,
} from "./types";

const converter = new showdown.Converter();
export class StandardNotes implements IProvider {
  public supportedExtensions = [".txt"];
  public validExtensions = [...this.supportedExtensions];
  public version = "1.0.0";
  public name = "StandardNotes";

  getContentType(
    item: StandardnotesNote,
    components: StandardnotesNote[]
  ): EditorType {
    let componentData =
      item.content.appData["org.standardnotes.sn.components"] || {};
    let editorId = Object.keys(componentData).pop();
    if (editorId) {
      let editor = components.find((component) => component.uuid === editorId);
      if (editor) {
        let contentType = {
          ...editors[editor.content.name],
        };
        if (contentType.type === "code") {
          //@ts-ignore
          contentType.mode = componentData[editorId].mode;
        }

        return contentType;
      }
    }
    return {
      type:
        item.content.text.includes("<") && item.content.text.includes("</")
          ? "html"
          : "text",
    };
  }

  getTags(item: StandardnotesNote, tags: StandardnotesNote[]): string[] {
    if (!item.content.references || item.content.references.length === 0)
      return [];
    let references = item.content.references;

    let noteTags = [];
    for (let reference of references) {
      let tag = tags.find((tag) => tag.uuid === reference.uuid);
      if (tag && tag.content.name && tag.content.name.trim() !== "") {
        noteTags.push(tag.content.name);
      }
    }
    return noteTags;
  }

  buildTableWithRows(rows: string) {
    return `<div class="table-container">
    <table>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
  <p><br data-mce-bogus="1"/></p>`;
  }

  /**
   * Find object in array with maximum index
   * @param array
   * @returns
   */
  maxIndexItem(array: any[]) {
    return array.reduce((prev, current) =>
      prev.index > current.index ? prev : current
    );
  }

  parseContent(item: StandardnotesNote): Content {
    const data = item.content.text;
    const editorType = item.content.editorType;
    switch (editorType.type) {
      case "text":
        return {
          data: converter.makeHtml(data),
          type: ContentType.HTML,
        };
      case "html":
        return {
          data: data,
          type: ContentType.HTML,
        };
      case "markdown":
        return {
          data: converter.makeHtml(data),
          type: ContentType.HTML,
        };
      case "code":
        let language = editorType.mode || "plaintext";
        if (language === "htmlmixed") language = "html";
        let code = hljs.highlightAuto(data, [language]);
        let html = `<pre class="hljs language-${language}">
          ${code.value}
        </pre>`;
        return {
          type: ContentType.HTML,
          data: html,
        };
      case "json":
        if (editorType.jsonFormat === "token") {
          let tokens = <TokenVaultItem[]>JSON.parse(data);

          let html = `
          ${tokens.map((token) =>
            this.buildTableWithRows(
              Object.keys(token)
                .map(
                  (key) => `<tr>
              <th style="width:130px" >${key}</th>
              <td>${token[key] || ""}</td>
            </tr>`
                )
                .join("")
            )
          )}`;
          return {
            data: html,
            type: ContentType.HTML,
          };
        } else {
          let spreadsheet = <SpreadSheet>JSON.parse(data);
          let html = ``;
          for (let sheet of spreadsheet.sheets) {
            if (sheet.rows.length > 0) {
              let maxCols =
                this.maxIndexItem(
                  sheet.rows.map((row) => {
                    return this.maxIndexItem(row.cells);
                  })
                ).index + 1;

              let maxRows = this.maxIndexItem(sheet.rows).index + 1;
              let rows = [];

              for (let i = 0; i < maxRows; i++) {
                let rowAtIndex = sheet.rows.find((row) => row.index === i);
                // create an empty row to fill index
                if (!rowAtIndex) rowAtIndex = { index: i, cells: [] };
                let cells = [];
                for (let col = 0; col < maxCols; col++) {
                  let cellAtCol = rowAtIndex.cells.find(
                    (cell) => cell.index === col
                  );
                  // create an empty cell to fill index
                  if (!cellAtCol) cellAtCol = { value: "", index: col };
                  cells.push(`<td>${cellAtCol.value || ""}</td>`);
                }
                rows.push(`<tr>
                ${cells.join("")}
                </tr>`);
              }

              let table = this.buildTableWithRows(rows.join(""));
              html = html + table;
            }
          }
          return {
            type: ContentType.HTML,
            data: html,
          };
        }
      default:
        return {
          data: converter.makeHtml(data),
          type: ContentType.HTML,
        };
    }
  }

  async process(
    files: File[],
    settings: ProviderSettings
  ): Promise<ProviderResult> {
    return iterate(this, files, (file, notes) => {
      if (file.name !== "Standard Notes Backup and Import File.txt")
        return Promise.resolve(true);
      let data: BackupType = <BackupType>JSON.parse(file.text);
      const components = data.items.filter(
        (item) => item.content_type === "SN|Component"
      );
      const tags = data.items.filter(
        (item) =>
          item.content_type === "Tag" || item.content_type === "SN|SmartTag"
      );
      const snNotes = data.items.filter((item) => item.content_type === "Note");

      for (let item of snNotes) {
        let type = this.getContentType(item, components);
        item.content.editorType = type;
        let note: Note = {
          title: item.content.title,
          dateCreated: item.created_at_timestamp,
          dateEdited: item.updated_at_timestamp || item.created_at_timestamp,
          pinned: item.content.appData["org.standardnotes.sn"]?.pinned,
          tags: this.getTags(item, tags),
          content: this.parseContent(item),
        };
        notes.push(note);
      }

      return Promise.resolve(true);
    });
  }
}
