import { ContentType, Note } from "../../models/note";
import { File } from "../../utils/file";
import { IProvider, ProviderSettings } from "../provider";

export class HTML implements IProvider {
  public supportedExtensions = [".html"];
  public version = "1.0.0";
  public name = "HTML";

  async process(files: File[], settings: ProviderSettings): Promise<Note[]> {
    const notes: Note[] = [];

    for (const file of files) {
      if (file.extension && !this.supportedExtensions.includes(file.extension))
        continue;

      const data = file.text;
      let note: Note = {
        title: file.name || data.slice(0, 40),
        dateCreated: file.createdAt,
        dateEdited: file.modifiedAt,
        content: { type: ContentType.HTML, data },
      };
      notes.push(note);
    }

    return notes;
  }
}
