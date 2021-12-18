import { ContentType, Note } from "../../models/note";
import { File } from "../../utils/file";
import {
  IProvider,
  iterate,
  ProviderResult,
  ProviderSettings,
} from "../provider";
import { parse } from "node-html-parser";
import { path } from "../../utils/path";

export class HTML implements IProvider {
  public supportedExtensions = [".html"];
  public validExtensions = [...this.supportedExtensions];
  public version = "1.0.0";
  public name = "HTML";

  async process(
    files: File[],
    settings: ProviderSettings
  ): Promise<ProviderResult> {
    return iterate(this, files, (file, notes) => {
      const data = file.text;
      const document = parse(data);

      const title =
        document.querySelector("title")?.textContent ||
        document.querySelector("h1,h2")?.textContent;
      let note: Note = {
        title: title || path.basename(file.name),
        dateCreated: file.createdAt,
        dateEdited: file.modifiedAt,
        content: {
          type: ContentType.HTML,
          data: document.querySelector("body")?.innerHTML || data,
        },
      };
      notes.push(note);

      return Promise.resolve(true);
    });
  }
}
