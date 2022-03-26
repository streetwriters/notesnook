import { Button, Text } from "@theme-ui/components";
import { pack } from "@notesnook/importer";
import { useCallback, useState } from "react";
import { ProviderResult } from "@notesnook/importer/dist/src/providers/provider";
import { Note } from "@notesnook/importer/dist/src/models/note";
import { StepContainer } from "./StepContainer";
import { NotePreview } from "./NotePreview";
import { ImportErrors } from "./ImportErrors";
import { ImportHelp } from "./ImportHelp";
import { saveAs } from "file-saver";
import { NotesList } from "./NotesList";

type ImportResultProps = {
  result: ProviderResult;
};

export function ImportResult(props: ImportResultProps) {
  const { result } = props;
  const [selectedNote, setSelectedNote] = useState<Note | undefined>();

  const downloadAsZip = useCallback(() => {
    if (!result) return;
    const packed = pack(result.notes);
    saveAs(
      new Blob([packed], { type: "application/zip" }),
      `notesnook-importer.zip`
    );
  }, [result]);

  return (
    <StepContainer
      sx={{
        flexDirection: "column",
        alignItems: "stretch",
      }}
    >
      <Text variant="title">Your notes are ready for download</Text>
      {result ? (
        <>
          <Text variant="body" sx={{ color: "fontTertiary" }}></Text>
          <NotesList
            notes={result?.notes}
            onNoteSelected={(note) => setSelectedNote(note)}
          />
          {result.errors.length > 0 && <ImportErrors errors={result.errors} />}
          <ImportHelp onDownload={downloadAsZip} />
          <Button
            variant="primary"
            sx={{ alignSelf: "center", mt: 2 }}
            onClick={downloadAsZip}
          >
            Download ZIP file
          </Button>
        </>
      ) : null}
      {selectedNote && (
        <NotePreview
          note={selectedNote}
          onClose={() => setSelectedNote(undefined)}
        />
      )}
    </StepContainer>
  );
}
