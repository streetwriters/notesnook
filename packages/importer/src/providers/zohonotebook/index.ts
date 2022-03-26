import { ContentType, Note, Notebook } from "../../models/note";
import { File, IFile } from "../../utils/file";
import {
  IFileProvider,
  iterate,
  ProviderResult,
  ProviderSettings,
} from "../provider";
import { path } from "../../utils/path";
import { ZNotebook } from "./types";
import { Znel } from "@notesnook/znel";
import { ElementHandler } from "./elementhandlers";

export class ZohoNotebook implements IFileProvider {
  public type: "file" = "file";
  public supportedExtensions = [".znel"];
  public validExtensions = [...this.supportedExtensions];
  public version = "1.0.0";
  public name = "Zoho Notebook";

  async process(
    files: File[],
    settings: ProviderSettings
  ): Promise<ProviderResult> {
    return iterate(this, files, async (file, notes) => {
      const notebook = this.getNotebook(file, files);
      const znel = new Znel(file.text);

      const note: Note = {
        title: znel.metadata.title,
        tags: znel.tags,
        dateCreated: znel.metadata.createdDate?.getTime(),
        dateEdited: znel.metadata.modifiedDate?.getTime(),
        attachments: [],
        notebooks: notebook ? [notebook] : [],
      };

      const elementHandler = new ElementHandler(note, files, settings.hasher);
      const html = await znel.content.toHtml(elementHandler);
      note.content = {
        data: html,
        type: ContentType.HTML,
      };
      notes.push(note);

      return true;
    });
  }

  private getNotebook(file: File, files: File[]): Notebook | undefined {
    const rootArchiveName = file.parent?.parent?.name || "";
    const archivePath = file.parent?.path;

    const rootDirectory = archivePath?.split("/")?.slice(0, 2) || [];

    const notebookPath = path.join(
      rootArchiveName,
      ...rootDirectory,
      "meta.json"
    );

    const notebookFile = files.find((f) => f.path === notebookPath);
    let notebook: Notebook | undefined;
    if (notebookFile) {
      const zohoNotebook: ZNotebook = JSON.parse(notebookFile.text);
      notebook = { notebook: zohoNotebook.name, topic: "All notes" };
    }
    return notebook;
  }
}
