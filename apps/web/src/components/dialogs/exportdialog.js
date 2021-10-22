import React, { useState } from "react";
import { Flex, Button, Text } from "rebass";
import * as Icon from "../icons";
import Dialog from "./dialog";
import download from "../../utils/download";
import { zip } from "../../utils/zip";
import { db } from "../../common/db";

const formats = [
  {
    type: "pdf",
    title: "PDF",
    icon: Icon.PDF,
    subtitle:
      "Can be opened in any PDF reader like Adobe Acrobat or Foxit Reader.",
  },
  {
    type: "md",
    title: "Markdown",
    icon: Icon.Markdown,
    subtitle: "Can be opened in any plain-text or markdown editor.",
  },
  {
    type: "html",
    title: "HTML",
    icon: Icon.HTML,
    subtitle: "Can be opened in any web browser like Google Chrome.",
  },
  {
    type: "txt",
    title: "Text",
    icon: Icon.Text,
    subtitle: "Can be opened in any plain-text editor.",
  },
];
function ExportDialog(props) {
  const { noteIds } = props;
  const [progress, setProgress] = useState();

  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      description="You can export your notes as Markdown, HTML, PDF or Text."
      onClose={props.onClose}
      scrollable
      negativeButton={{
        onClick: props.onClose,
        text: "Cancel",
      }}
    >
      <Flex my={2} flexDirection="row" justifyContent="center">
        {progress ? (
          <Flex>
            <Text variant="body">
              Processing note {progress} of {noteIds.length}
            </Text>
          </Flex>
        ) : (
          <>
            {formats.map(({ type, title, icon: Icon }) => {
              if (type === "pdf" && noteIds.length > 1) return null;

              return (
                <Button
                  key={type}
                  data-test-id={`export-dialog-${type}`}
                  variant="tertiary"
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    mr: 2,
                    ":last-of-type": { mr: 0 },
                  }}
                  onClick={async () => {
                    const format = type;
                    if (format === "pdf") {
                      const note = db.notes.note(noteIds[0]);
                      let result = await exportToPDF(await note.export("html"));
                      return result;
                    }

                    var files = [];
                    let index = 0;
                    for (var noteId of noteIds) {
                      setProgress(index++);
                      const note = db.notes.note(noteId);
                      const content = await note.export(format);
                      if (!content) continue;
                      files.push({ filename: note.title, content });
                    }
                    if (!files.length) return false;
                    if (files.length === 1) {
                      download(files[0].filename, files[0].content, format);
                    } else {
                      const zipped = await zip(files, format);
                      download("notes", zipped, "zip");
                    }

                    setProgress();
                    props.onDone();
                  }}
                >
                  <Icon color="primary" size={48} />
                  <Text textAlign="center">{title}</Text>
                </Button>
              );
            })}
          </>
        )}
      </Flex>
    </Dialog>
  );
}
export default ExportDialog;

async function exportToPDF(content) {
  if (!content) return false;
  return new Promise((resolve) => {
    return import("print-js").then(async ({ default: printjs }) => {
      printjs({
        printable: content,
        type: "raw-html",
        onPrintDialogClose: () => {
          resolve();
        },
      });
      return true;
      // TODO
      // const doc = new jsPDF("p", "px", "letter");
      // const div = document.createElement("div");
      // const { width, height } = doc.internal.pageSize;
      // div.innerHTML = content;
      // div.style.width = width - 80 + "px";
      // div.style.height = height - 80 + "px";
      // div.style.position = "absolute";
      // div.style.top = 0;
      // div.style.left = 0;
      // div.style.margin = "40px";
      // div.style.fontSize = "11px";
      // document.body.appendChild(div);

      // await doc.html(div, {
      //   callback: async (doc) => {
      //     div.remove();
      //     resolve(doc.output());
      //   },
      // });
    });
  });
}
