import React from "react";
import { Flex, Button, Text } from "rebass";
import { db } from "../../common";
import download from "../../utils/download";
import { zip } from "../../utils/zip";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";

const formats = [
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
    subtitle: "Can be opened in any browser.",
  },
  {
    type: "txt",
    title: "Text",
    icon: Icon.Text,
    subtitle: "Can be opened in any plain-text editor.",
  },
];
function ExportDialog(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      description="You can export your note to Markdown, HTML, or Text."
      onClose={props.onClose}
      scrollable
      negativeButton={{
        onClick: props.onClose,
        text: "Cancel",
      }}
    >
      <Flex flexDirection="column">
        {formats.map((format) => (
          <Button
            variant="tertiary"
            sx={{ display: "flex" }}
            mb={1}
            onClick={() => props.exportNote(format.type)}
          >
            <format.icon
              color="primary"
              sx={{ p: 1, bg: "shade", borderRadius: "default" }}
            />
            <Flex flexDirection="column" alignItems="flex-start" ml={2}>
              <Text variant="title" textAlign="left">
                {format.title}
              </Text>
              <Text
                variant="subtitle"
                textAlign="left"
                fontWeight="normal"
                color="gray"
              >
                {format.subtitle}
              </Text>
            </Flex>
          </Button>
        ))}
      </Flex>
    </Dialog>
  );
}

export function showExportDialog(noteIds) {
  return showDialog((perform) => (
    <ExportDialog
      title={
        noteIds.length > 1 ? `Export ${noteIds.length} notes` : "Export note"
      }
      icon={Icon.Export}
      onClose={() => perform(false)}
      exportNote={async (format) => {
        var files = [];
        for (var noteId of noteIds) {
          const note = db.notes.note(noteId);
          const content = await note.export(format);
          if (!content) continue;
          files.push({ filename: note.title, content });
        }
        if (!files.length) return perform(false);
        if (files.length === 1) {
          download(files[0].filename, files[0].content, format);
        } else {
          const zipped = zip(files, format);
          download("notes", zipped, "zip");
        }
        perform(true);
      }}
    />
  ));
}
