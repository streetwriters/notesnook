import React from "react";
import { Flex, Button, Text, Box } from "rebass";
import { db } from "../../common";
import download from "../../utils/download";
import { showToast } from "../../utils/toast";
import * as Icon from "../icons";
import Dialog, { showDialog } from "./dialog";

function ExportDialog(props) {
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      icon={props.icon}
      negativeButton={{ onClick: props.onClose, text: "Cancel" }}
    >
      <Box>
        <Text variant="body" mb={2}>
          Please choose a format to export the note into:
        </Text>
        <Flex my={1} justifyContent="center" alignItems="center">
          <Button
            variant="tertiary"
            mr={2}
            onClick={() => props.exportNote("html")}
          >
            <Icon.HTML size={100} color="dimPrimary" /> HTML
          </Button>
          <Button
            variant="tertiary"
            mr={2}
            onClick={() => props.exportNote("md")}
          >
            <Icon.Markdown size={100} color="dimPrimary" />
            Markdown
          </Button>
          <Button
            variant="tertiary"
            mr={2}
            onClick={() => props.exportNote("txt")}
          >
            <Icon.Text size={100} color="dimPrimary" />
            Text
          </Button>
        </Flex>
      </Box>
    </Dialog>
  );
}

export function showExportDialog(noteId) {
  return showDialog((perform) => (
    <ExportDialog
      title={"Export Note"}
      icon={Icon.Export}
      onClose={() => perform(false)}
      exportNote={async (format) => {
        const note = db.notes.note(noteId);
        const content = await note.export(format);
        download(note.title, content, format);
        showToast("success", `Note exported as ${format} successfully!`);
        perform(true);
      }}
    />
  ));
}
