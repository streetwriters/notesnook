import { Text, Button } from "@theme-ui/components";
import { StepContainer } from "./StepContainer";
import { INetworkProvider, pack } from "@notesnook/importer";
import {
  ProviderResult,
  ProviderSettings,
} from "@notesnook/importer/dist/src/providers/provider";
import { xxhash64 } from "hash-wasm";
import { OneNote } from "@notesnook/importer/dist/src/providers/onenote";
import { useCallback, useEffect, useState } from "react";
import { Note } from "@notesnook/importer/dist/src/models/note";
import saveAs from "file-saver";
import { NotePreview } from "./NotePreview";
import { ImportHelp } from "./ImportHelp";
import { ImportErrors } from "./ImportErrors";
import { NotesList } from "./NotesList";

type NetworkProviderHandlerProps = {
  provider: INetworkProvider<unknown>;
};

const settings: ProviderSettings = {
  clientType: "browser",
  hasher: { type: "xxh64", hash: (data) => xxhash64(data) },
};

export function NetworkProviderHandler(props: NetworkProviderHandlerProps) {
  const { provider } = props;

  const [progress, setProgress] = useState<string | null>();
  const [result, setResult] = useState<ProviderResult | undefined>();
  const [selectedNote, setSelectedNote] = useState<Note | undefined>();
  const startImport = useCallback(() => {
    (async () => {
      if (!provider) return;

      setProgress(null);
      let result: ProviderResult = { notes: [], errors: [] };
      if (provider instanceof OneNote) {
        result = await provider.process({
          ...settings,
          clientId: "4952c7cf-9c02-4fb7-b867-b87727bb52d8",
          report: setProgress,
        });
      }

      setProgress(null);
      setResult(result);
    })();
  }, [provider]);

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
      {progress ? (
        <>
          <Text variant="title">Importing your notes from {provider.name}</Text>
          <Text variant="body" sx={{ textAlign: "center", my: 4 }}>
            {progress}
          </Text>
        </>
      ) : result ? (
        <>
          <Text variant="title">Your notes are ready for download</Text>
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
      ) : (
        <>
          <Text variant="title">Connect your {provider.name} account</Text>
          <Button
            variant="primary"
            onClick={startImport}
            sx={{ my: 4, alignSelf: "center" }}
          >
            Login &amp; start importing
          </Button>
        </>
      )}
      {selectedNote && (
        <NotePreview
          note={selectedNote}
          onClose={() => setSelectedNote(undefined)}
        />
      )}
    </StepContainer>
  );
}
