import {
  INetworkProvider,
  ProviderResult,
  ProviderSettings,
} from "../provider";
import { OneNoteClient } from "@notesnook/onenote";
import { Content } from "@notesnook/onenote/dist/src/content";
import {
  IProgressReporter,
  ProgressPayload,
} from "@notesnook/onenote/dist/src/types";
import { ContentType, Note, Notebook } from "../../models/note";
import {
  SectionGroup,
  OnenoteSection,
  OnenotePage,
} from "@microsoft/microsoft-graph-types-beta";
import parse from "node-html-parser";
import { ElementHandler } from "./elementhandlers";

type OneNoteSettings = ProviderSettings & {
  clientId: string;
  report?: (message: string) => void;
};

export class OneNote implements INetworkProvider<OneNoteSettings> {
  type: "network" = "network";
  public version = "1.0.0";
  public name = "OneNote";

  async process(settings: OneNoteSettings): Promise<ProviderResult> {
    const notes: Note[] = [];
    const errors: Error[] = [];

    const progressCache: Record<string, ProgressPayload> = {};
    const client = new OneNoteClient(
      { clientId: settings.clientId },
      {
        error: (e) => {
          errors.push(e);
        },
        report: (progress) => {
          progressCache[progress.type] = progress;
          if (settings.report)
            settings.report(structuredMessage(progressCache));
        },
      }
    );

    const notebooks = await client.getNotebooks();
    for (let notebook of notebooks) {
      for (let section of notebook.sections ?? []) {
        const sectionNotebooks = this.getNotebooks(section);
        if (!section.pages) continue;

        for (let i = 0; i < section.pages.length; ++i) {
          const page = section.pages[i];
          if (settings.report)
            settings.report(
              `Transforming pages (${i + 1}/${section.pages.length})`
            );

          const note = await this.pageToNote(
            page,
            sectionNotebooks,
            settings
          ).catch((e: Error) => {
            e.message = `${e.message} (page: ${page.title})`;
            errors.push(e);
            return null;
          });
          if (!note) continue;

          notes.push(note);
        }
      }
    }

    if (settings.report) settings.report(`Done!`);
    return { errors, notes };
  }

  private async pageToNote(
    page: OnenotePage,
    notebooks: Notebook[],
    settings: OneNoteSettings
  ): Promise<Note | null> {
    if (!(page.content instanceof Content)) return null;

    const note: Note = {
      title: "Untitled note",
      dateCreated: page.createdDateTime
        ? new Date(page.createdDateTime).getTime()
        : undefined,
      dateEdited: page.lastModifiedDateTime
        ? new Date(page.lastModifiedDateTime).getTime()
        : undefined,
      tags: page.userTags ?? [],
      notebooks,
      attachments: [],
    };

    const elementHandler = new ElementHandler(note, settings.hasher);
    const data = await page.content.transform(elementHandler);
    const document = parse(data);

    note.title =
      page.title ||
      document.querySelector("title")?.textContent ||
      document.querySelector("h1,h2")?.textContent ||
      note.title;

    note.content = {
      data,
      type: ContentType.HTML,
    };

    return note;
  }

  private getNotebooks(section: OnenoteSection): Notebook[] {
    const notebooks: Notebook[] = [];
    const topic = section?.displayName || "Untitled topic";

    if (section?.parentNotebook?.displayName) {
      notebooks.push({
        topic,
        notebook: section.parentNotebook.displayName,
      });
      if (section?.parentSectionGroup) {
        const flattenedSectionGroupsTitle = this.getFlattenedSectionGroupsTitle(
          section.parentSectionGroup
        );
        const notebookTitle = `${
          section.parentNotebook.displayName
        }: ${flattenedSectionGroupsTitle.reverse().join(">")}`;
        notebooks.push({ topic, notebook: notebookTitle });
      }
    }

    return notebooks;
  }

  private getFlattenedSectionGroupsTitle(section: SectionGroup): string[] {
    const parts: string[] = [];
    if (section?.displayName) parts.push(section.displayName);
    if (section?.parentSectionGroup)
      parts.push(
        ...this.getFlattenedSectionGroupsTitle(section.parentSectionGroup)
      );
    return parts;
  }
}

function structuredMessage(cache: Record<string, ProgressPayload>): string {
  const sequence = ["notebook", "sectionGroup", "section", "page"];
  let parts: string[] = [];
  for (let key of sequence) {
    const value = cache[key];
    if (!value || value.total == value.current) continue;
    parts.push(progressToString(value));
  }
  return parts.join(" => ");
}

function progressToString(payload: ProgressPayload): string {
  const parts: string[] = [];
  switch (payload.op) {
    case "fetch":
      parts.push("Fetching");
      break;
    case "process":
      parts.push("Processing");
      break;
  }

  switch (payload.type) {
    case "notebook":
      parts.push("notebooks");
      break;
    case "page":
      parts.push("pages");
      break;
    case "section":
      parts.push("sections");
      break;
    case "sectionGroup":
      parts.push("section groups");
      break;
  }

  parts.push(`(${payload.current + 1}/${payload.total})`);
  return parts.join(" ");
}
