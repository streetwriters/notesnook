import React from "react";
import { Flex, Button, Text } from "rebass";
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
      description="You can export your note to Markdown, HTML, or Text."
      buttonsAlignment="center"
      onClose={props.onClose}
      negativeButton={{
        onClick: props.onClose,
        text: "Cancel",
      }}
    >
      <Flex justifyContent="center" alignItems="center">
        <Button mr={2} onClick={() => props.exportNote("html")}>
          <Flex variant="rowCenter">
            <Icon.HTML color="static" />
            <Text ml={1}>HTML</Text>
          </Flex>
        </Button>
        <Button mr={2} onClick={() => props.exportNote("md")}>
          <Flex variant="rowCenter">
            <Icon.Markdown color="static" />
            <Text ml={1}>Markdown</Text>
          </Flex>
        </Button>
        <Button mr={2} onClick={() => props.exportNote("txt")}>
          <Flex variant="rowCenter">
            <Icon.Text color="static" />
            <Text ml={1}>Text</Text>
          </Flex>
        </Button>
      </Flex>
    </Dialog>
  );
}

export function showExportDialog(noteId) {
  return showDialog((perform) => (
    <ExportDialog
      title={"Export your Note"}
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
