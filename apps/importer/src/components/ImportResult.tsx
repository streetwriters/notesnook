import { Button, Text } from "@theme-ui/components";
import { pack, transform } from "@notesnook/importer";
import { useCallback, useEffect, useState } from "react";
import {
  ProviderResult,
  ProviderSettings,
} from "@notesnook/importer/dist/src/providers/provider";
import { Providers } from "@notesnook/importer/dist/src/providers/providerfactory";
import { IFile } from "@notesnook/importer/dist/src/utils/file";
import { xxhash64 } from "hash-wasm";
import { Note } from "@notesnook/importer/dist/src/models/note";
import { StepContainer } from "./StepContainer";
import { NotePreview } from "./NotePreview";
import { ImportErrors } from "./ImportErrors";
import { ImportHelp } from "./ImportHelp";
import { saveAs } from "file-saver";
import { NotesList } from "./NotesList";

type ResultProps = {
  files: File[];
  provider: Providers | undefined;
};

type Progress = {
  total: number;
  done: number;
};

const settings: ProviderSettings = {
  hasher: { type: "xxh64", hash: (data) => xxhash64(data) },
};

export function ImportResult(props: ResultProps) {
  const { provider, files } = props;

  const [progress, setProgress] = useState<Progress>({ total: 0, done: 0 });
  const [result, setResult] = useState<ProviderResult | undefined>();
  const [selectedNote, setSelectedNote] = useState<Note | undefined>();
  useEffect(() => {
    (async () => {
      if (!provider) return;

      setProgress({ total: 0, done: 0 });
      let result: ProviderResult = { notes: [], errors: [] };
      for (let file of files) {
        const providerFile: IFile = {
          name: file.name,
          data: await file.arrayBuffer(),
          modifiedAt: file.lastModified,
        };
        const transformResult = await transform(
          [providerFile],
          provider,
          settings
        );
        result.notes.push(...transformResult.notes);
        result.errors.push(...transformResult.errors);
        setProgress((p) => ({ total: files.length, done: p.done + 1 }));
      }
      setProgress({ total: 0, done: 0 });
      setResult(result);
    })();
  }, [provider, files]);

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
      {progress.total > 0 ? (
        <Text variant="body">
          Processing files ({progress.done}/{progress.total})
        </Text>
      ) : result ? (
        <>
          <Text variant="body" sx={{ color: "fontTertiary" }}></Text>
          <NotesList
            notes={result?.notes}
            filesLength={files.length}
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
