import download from "../utils/download";
import { db } from "./db";
import { TaskManager } from "./task-manager";
import { zip } from "../utils/zip";

async function exportToPDF(content: string): Promise<boolean> {
  if (!content) return false;
  const { default: printjs } = await import("print-js");
  return new Promise(async (resolve) => {
    printjs({
      printable: content,
      type: "raw-html",
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
        const note = db.notes.note(noteIds[0]);
        return await exportToPDF(await note.export("html"));
      }

      var files = [];
      let index = 0;
      for (var noteId of noteIds) {
        const note = db.notes.note(noteId);
        report({
          current: ++index,
          total: noteIds.length,
          text: `Exporting "${note.title}"...`,
        });
        console.log("Exporting", note.title);
        const content = await note.export(format).catch(() => {});
        if (!content) continue;
        files.push({ filename: note.title, content });
      }

      if (!files.length) return false;
      if (files.length === 1) {
        download(files[0].filename, files[0].content, format);
      } else {
        const zipped = zip(files, format);
        download("notes", zipped, "zip");
      }
      return true;
    },
  });
}
