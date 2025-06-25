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

import {
  Attachment,
  Note,
  parseInternalLink,
  getContentFromData,
  ResolveInternalLink,
  isImage,
  isWebClip,
  CHECK_IDS,
  checkIsUserPremium,
  FilteredSelector,
  EMPTY_CONTENT
} from "@notesnook/core";
import { sanitizeFilename } from "./file.js";
import { database } from "../database.js";
import { join, relative } from "pathe";
import { PathTree } from "./path-tree.js";

export const FORMAT_TO_EXT = {
  pdf: "pdf",
  md: "md",
  txt: "txt",
  html: "html",
  "md-frontmatter": "md"
} as const;

type BaseExportableItem = {
  path: string;
  mtime: Date;
  ctime: Date;
};
export type ExportableItem = ExportableNote | ExportableAttachment;
export type ExportableNote = BaseExportableItem & {
  type: "note";
  data: string;
};
export type ExportableAttachment = BaseExportableItem & {
  type: "attachment";
  data: Attachment;
};

export async function* exportNotes(
  notes: FilteredSelector<Note>,
  options: {
    format: keyof typeof FORMAT_TO_EXT;
    unlockVault?: () => Promise<boolean>;
  }
) {
  const { format } = options;
  if (format !== "txt" && !(await checkIsUserPremium(CHECK_IDS.noteExport)))
    return;

  const pathTree = new PathTree();
  const notePathMap: Map<string, string[]> = new Map();

  for await (const note of notes
    .fields(["notes.id", "notes.title"])
    .iterate()) {
    const filename = `${sanitizeFilename(note.title || "Untitled", {
      replacement: "-"
    })}.${FORMAT_TO_EXT[format]}`;
    const notebooks = await database.relations
      .to({ id: note.id, type: "note" }, "notebook")
      .get();

    const filePaths: string[] = [];
    for (const { fromId: notebookId } of notebooks) {
      const crumbs = (await database.notebooks.breadcrumbs(notebookId)).map(
        (n) => n.title
      );
      filePaths.push([...crumbs, filename].join("/"));
    }
    if (filePaths.length === 0) filePaths.push(filename);

    notePathMap.set(
      note.id,
      filePaths.map((p) => pathTree.add(p))
    );
  }

  // case where the user has a notebook named attachments
  const attachmentsRoot = pathTree.add("attachments", "underscore");
  const pendingAttachments: Map<string, Attachment> = new Map();

  for (const [id] of notePathMap) {
    const note = await database.notes.note(id);
    if (!note) continue;

    const notePaths = notePathMap.get(note.id);

    if (!notePaths) {
      yield new Error("Cannot export note because it has unresolved paths.");
      continue;
    }

    try {
      const content = await exportContent(note, {
        unlockVault: options.unlockVault,
        format,
        attachmentsRoot,
        pendingAttachments,
        resolveInternalLink: (link) => {
          const internalLink = parseInternalLink(link);
          if (!internalLink) return link;
          const paths = notePathMap.get(internalLink.id);
          if (!paths) return link;
          // if the internal link is linking within the same note
          if (paths === notePaths) return `{{NOTE_PATH:}}`;
          return `{{NOTE_PATH:${paths[0]}}}`;
        }
      });
      if (!content) continue;

      for (const path of notePaths) {
        yield <ExportableNote>{
          type: "note",
          path,
          data: resolvePaths(content, path),
          mtime: new Date(note.dateEdited),
          ctime: new Date(note.dateCreated)
        };
      }
    } catch (e) {
      if (e instanceof Error) {
        e.message = `Failed to export note "${note.title || "<Untitled>"}": ${
          e.message
        }`;
        yield e;
      }
    }
  }

  for (const [path, attachment] of pendingAttachments) {
    yield <ExportableAttachment>{
      type: "attachment",
      path,
      data: attachment,
      mtime: new Date(attachment.dateModified),
      ctime: new Date(attachment.dateCreated)
    };
  }
}

export async function* exportNote(
  note: Note,
  options: {
    format: keyof typeof FORMAT_TO_EXT;
    unlockVault?: () => Promise<boolean>;
  }
) {
  const { format } = options;
  if (format !== "txt" && !(await checkIsUserPremium(CHECK_IDS.noteExport)))
    return;

  const attachmentsRoot = "attachments";
  const filename = sanitizeFilename(note.title || "Untitled", {
    replacement: "-"
  });
  const ext = FORMAT_TO_EXT[options.format];
  const path = [filename, ext].join(".");
  const pendingAttachments: Map<string, Attachment> = new Map();

  try {
    const content = await exportContent(note, {
      format,
      attachmentsRoot,
      pendingAttachments,
      unlockVault: options.unlockVault
    });
    if (!content) return false;

    yield <ExportableNote>{
      type: "note",
      path,
      data: resolvePaths(content, path),
      mtime: new Date(note.dateEdited),
      ctime: new Date(note.dateCreated)
    };

    for (const [path, attachment] of pendingAttachments) {
      yield <ExportableAttachment>{
        type: "attachment",
        path,
        data: attachment,
        mtime: new Date(attachment.dateModified),
        ctime: new Date(attachment.dateCreated)
      };
    }
  } catch (e) {
    if (e instanceof Error) {
      e.message = `Failed to export note "${note.title || "<Untitled>"}": ${
        e.message
      }`;
      yield e;
    }
  }
}

export async function exportContent(
  note: Note,
  options: {
    format: keyof typeof FORMAT_TO_EXT;
    unlockVault?: () => Promise<boolean>;
    disableTemplate?: boolean;

    // TODO: remove these
    attachmentsRoot?: string;
    pendingAttachments?: Map<string, Attachment>;
    resolveInternalLink?: ResolveInternalLink;
  }
) {
  const {
    format,
    unlockVault,
    resolveInternalLink,
    attachmentsRoot,
    pendingAttachments,
    disableTemplate
  } = options;
  const rawContent = await database.content.findByNoteId(note.id);

  if (
    rawContent?.locked &&
    !database.vault.unlocked &&
    !(await unlockVault?.())
  ) {
    throw new Error(
      `Could not export locked note: "${note.title || "<Untitled>"}".`
    );
  }

  const contentItem = rawContent?.locked
    ? await database.vault.decryptContent(rawContent)
    : // .catch((e) => {
      //     console.error(e, note);
      //     return <NoteContent<false>>{
      //       type: "tiptap",
      //       data: `This note could not be decrypted: ${e}`
      //     };
      //   })
      rawContent;

  const { data, type } =
    format === "pdf"
      ? await database.content.downloadMedia(
          `export-${note.id}`,
          contentItem || EMPTY_CONTENT(note.id),
          false
        )
      : contentItem || EMPTY_CONTENT(note.id);

  const content = await getContentFromData(type, data);
  if (resolveInternalLink) content.resolveInternalLinks(resolveInternalLink);

  if (
    attachmentsRoot &&
    pendingAttachments &&
    format !== "txt" &&
    format !== "pdf"
  ) {
    await content.resolveAttachments(async (elements) => {
      const hashes = Object.keys(elements);
      const attachments = await database.attachments.all
        .where((eb) => eb("attachments.hash", "in", hashes))
        .items();

      const sources: Record<string, string> = {};
      for (const attachment of attachments) {
        const filename = [attachment.hash, attachment.filename].join("-");
        const attachmentPath = join(attachmentsRoot, filename);
        sources[attachment.hash] = resolveAttachment(
          elements,
          attachment,
          attachmentPath,
          format
        );
        pendingAttachments.set(attachmentPath, attachment);
      }
      return sources;
    });
  }

  const exported = await database.notes.export(note, {
    disableTemplate,
    format: format === "pdf" ? "html" : format,
    rawContent:
      format === "html" || format === "pdf"
        ? content.toHTML()
        : format === "md" || format === "md-frontmatter"
        ? content.toMD()
        : content.toTXT()
  });
  if (typeof exported === "boolean" && !exported) return;
  return exported;
}

function resolveAttachment(
  elements: Record<string, Record<string, string>>,
  attachment: Attachment,
  attachmentPath: string,
  format: keyof typeof FORMAT_TO_EXT
) {
  const relativePath = `{{NOTE_PATH:${attachmentPath}}}`;
  const attributes = elements[attachment.hash];

  if (isImage(attachment.mimeType)) {
    const classes: string[] = [];
    if (attributes["data-float"] === "true") classes.push("float");
    if (attributes["data-align"] === "right") classes.push("align-right");
    if (attributes["data-align"] === "center") classes.push("align-center");

    return `<img class="${classes.join(" ")}" src="${relativePath}" alt="${
      attachment.filename
    }" width="${attributes.width}" height="${attributes.height}" />`;
  }
  // markdown doesn't allow arbitrary iframes in its html so no need
  // to support that
  else if (isWebClip(attachment.mimeType) && format === "html") {
    return `<iframe src="${relativePath} "width="${attributes.width}" height="${attributes.height}" />`;
  }

  return `<a href="${relativePath}" title="${attachment.filename}">${attachment.filename}</a>`;
}

function resolvePaths(content: string, path: string) {
  return content.replace(/\{\{NOTE_PATH:(.+?)\}\}/gm, (str, ...args) => {
    console.log(str, args);
    const [to] = args;
    if (!to) return path;
    return relative(path, to).replace(/^..\//, "./");
  });
}
