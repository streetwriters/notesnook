import { db } from "./db";
import { TaskManager } from "./task-manager";
import { zip } from "../utils/zip";
import { saveAs } from "file-saver";

export async function exportToPDF(
  title: string,
  content: string
): Promise<boolean> {
  if (!content) return false;
  const { default: printjs } = await import("print-js");
  return new Promise(async (resolve) => {
    printjs({
      printable: content,
      type: "raw-html",
      documentTitle: title,
      header: '<h3 class="custom-h3">My custom header</h3>',
      onPrintDialogClose: () => {
        resolve(false);
      },
      onError: () => resolve(false),
    });
    resolve(true);
  });
}

export async function exportNotes(
  format: "pdf" | "md" | "txt" | "html",
  noteIds: string[]
): Promise<boolean> {
  return await TaskManager.startTask({
    type: "modal",
    title: "Exporting notes",
    subtitle: "Please wait while your notes are exported.",
    action: async (report) => {
      if (format === "pdf") {
        const note = db.notes!.note(noteIds[0]);
        return await exportToPDF(note.title, await note.export("html", null));
      }

      var files = [];
      let index = 0;
      for (var noteId of noteIds) {
        const note = db.notes!.note(noteId);
        report({
          current: ++index,
          total: noteIds.length,
          text: `Exporting "${note.title}"...`,
        });
        console.log("Exporting", note.title);
        const content: string = await note.export(format, null).catch(() => {});
        if (!content) continue;
        files.push({ filename: note.title, content });
      }

      if (!files.length) return false;
      if (files.length === 1) {
        saveAs(
          new Blob([Buffer.from(files[0].content, "utf-8")]),
          `${files[0].filename}.${format}`
        );
      } else {
        const zipped = await zip(files, format);
        saveAs(new Blob([zipped.buffer]), "notes.zip");
      }
      return true;
    },
  });
}
