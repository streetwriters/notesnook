import { ContentType, Note } from "../../models/note";
import showdown from "showdown";
import { IProvider, ProviderSettings } from "../provider";
import { File } from "../../utils/file";

const converter = new showdown.Converter();
export class Markdown implements IProvider {
  public supportedExtensions = [".md", ".txt"];
  public version = "1.0.0";
  public name = "Markdown";

  async process(files: File[], settings: ProviderSettings): Promise<Note[]> {
    const notes: Note[] = [];

    for (const file of files) {
      if (file.extension && !this.supportedExtensions.includes(file.extension))
        continue;

      const data = file.text;
      const html = converter.makeHtml(data);
      let note: Note = {
        title: file.name || data.slice(0, 40),
        dateCreated: file.createdAt,
        dateEdited: file.modifiedAt,
        content: { type: ContentType.HTML, data: html },
      };
      notes.push(note);
    }

    return notes;
  }
}
