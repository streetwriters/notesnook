import { ContentType, Note } from "../../models/note";
import showdown from "showdown";
import {
  IProvider,
  iterate,
  ProviderResult,
  ProviderSettings,
} from "../provider";
import { File } from "../../utils/file";
import { path } from "../../utils/path";
import parse from "node-html-parser";

const converter = new showdown.Converter();
export class Markdown implements IProvider {
  public supportedExtensions = [".md", ".txt"];
  public validExtensions = [...this.supportedExtensions];
  public version = "1.0.0";
  public name = "Markdown/Text";

  async process(
    files: File[],
    settings: ProviderSettings
  ): Promise<ProviderResult> {
    return iterate(this, files, (file, notes) => {
      const data = file.text;
      const html = converter.makeHtml(data);
      const document = parse(html);

      const title = document.querySelector("h1,h2")?.textContent;
      let note: Note = {
        title: title || path.basename(file.name),
        dateCreated: file.createdAt,
        dateEdited: file.modifiedAt,
        content: { type: ContentType.HTML, data: html },
      };
      notes.push(note);

      return Promise.resolve(true);
    });
  }
}
