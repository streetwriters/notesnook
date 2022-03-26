import { ContentType, Note } from "../../models/note";
import { SimplenoteExport } from "./types";
import {
  IFileProvider,
  iterate,
  ProviderResult,
  ProviderSettings,
} from "../provider";
import { File } from "../../utils/file";
import showdown from "showdown";

const converter = new showdown.Converter();
export class Simplenote implements IFileProvider {
  type: "file" = "file";
  public supportedExtensions = [".json"];
  public validExtensions = [".txt", ...this.supportedExtensions];
  public version = "1.0.0";
  public name = "Simplenote";

  async process(
    files: File[],
    settings: ProviderSettings
  ): Promise<ProviderResult> {
    return iterate(this, files, async (file, notes, errors) => {
      const data = file.text;
      const { activeNotes } = <SimplenoteExport>JSON.parse(data);
      if (!activeNotes) return false;

      for (let activeNote of activeNotes) {
        if (
          !activeNote.content ||
          !activeNote.creationDate ||
          !activeNote.lastModified
        ) {
          errors.push(
            new Error(
              `Invalid note. content, creationDate & lastModified properties are required. (File: ${file.name})`
            )
          );
          continue;
        }

        const lines = activeNote.content.split("\r\n");
        const title = lines.shift();
        const content = lines.join("\r\n");
        let note: Note = {
          title: title || "Untitled note",
          dateCreated: new Date(activeNote.creationDate).getTime(),
          dateEdited: new Date(activeNote.lastModified).getTime(),
          pinned: activeNote.pinned,
          tags: activeNote.tags,
          content: {
            type: ContentType.HTML,
            data: converter.makeHtml(content),
          },
        };

        notes.push(note);
      }

      return true;
    });
  }
}
