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

import { strings } from "@notesnook/intl";
import { Button, Flex, Input, Link, Text, Box } from "@theme-ui/components";
import { useCallback, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { db } from "../../../common/db";
import { CheckCircleOutline } from "../../../components/icons";
import Accordion from "../../../components/accordion";
import { importFiles } from "../../../utils/importer";
import { useStore as useAppStore } from "../../../stores/app-store";

type Provider = { title: string; link: string };
const POPULAR_PROVIDERS: Provider[] = [
  {
    title: "Evernote",
    link: "https://help.notesnook.com/importing-notes/import-notes-from-evernote"
  },
  {
    title: "Simplenote",
    link: "https://help.notesnook.com/importing-notes/import-notes-from-simplenote"
  },
  {
    title: "Google Keep",
    link: "https://help.notesnook.com/importing-notes/import-notes-from-googlekeep"
  },
  {
    title: "Obsidian",
    link: "https://help.notesnook.com/importing-notes/import-notes-from-obsidian"
  },
  {
    title: "Joplin",
    link: "https://help.notesnook.com/importing-notes/import-notes-from-joplin"
  },
  {
    title: "Markdown files",
    link: "https://help.notesnook.com/importing-notes/import-notes-from-markdown-files"
  },
  {
    title: "other apps",
    link: "https://help.notesnook.com/importing-notes/"
  }
];

export function Importer() {
  const [isDone, setIsDone] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const notesCounter = useRef<HTMLSpanElement>(null);
  const importProgress = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((files) => {
      const newFiles = [...acceptedFiles, ...files];
      return newFiles;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/zip": [".zip"]
    }
  });

  return (
    <Flex
      sx={{
        flexDirection: "column",
        // justifyContent: "center",
        overflow: "hidden"
      }}
    >
      {isImporting ? (
        <>
          <Text variant="title" sx={{ textAlign: "center", mb: 4, mt: 150 }}>
            <span ref={notesCounter}>0</span> {strings.notesImported()}.
          </Text>

          <Flex
            ref={importProgress}
            sx={{
              alignSelf: "start",
              borderRadius: "default",
              height: "5px",
              bg: "accent",
              width: `0%`
            }}
          />
        </>
      ) : isDone ? (
        <>
          <CheckCircleOutline color="accent" sx={{ mt: 150 }} />
          <Text variant="body" my={2} sx={{ textAlign: "center" }}>
            {strings.importCompleted()}. {strings.errorsOccured(errors.length)}
          </Text>
          <Button
            variant="secondary"
            sx={{ alignSelf: "center" }}
            onClick={async () => {
              setErrors([]);
              setFiles([]);
              setIsDone(false);
              setIsImporting(false);
            }}
          >
            {strings.startOver()}
          </Button>
          {errors.length > 0 && (
            <Flex
              my={1}
              bg="var(--background-error)"
              p={1}
              sx={{ flexDirection: "column" }}
            >
              {errors.map((error) => (
                <Text
                  key={error.message}
                  variant="body"
                  sx={{
                    color: "var(--paragraph-error)"
                  }}
                >
                  {error.message}
                </Text>
              ))}
            </Flex>
          )}
        </>
      ) : (
        <>
          <Accordion
            isClosed={false}
            title="How to import your notes from other apps?"
            containerSx={{
              px: 2,
              pb: 2,
              border: "1px solid var(--border)",
              borderTopWidth: 0,
              borderRadius: "default",
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0
            }}
          >
            <Text variant="subtitle" sx={{ mt: 2 }}>
              Quick start guide:
            </Text>
            <Box as="ol" sx={{ my: 1 }}>
              <Text as="li" variant="body">
                Go to{" "}
                <Link
                  href="https://importer.notesnook.com/"
                  target="_blank"
                  sx={{ color: "accent" }}
                >
                  https://importer.notesnook.com/
                </Link>
              </Text>
              <Text as="li" variant="body">
                Select the app you want to import from.
              </Text>
              <Text as="li" variant="body">
                Drag drop or select the files you exported from the other app.
              </Text>
              <Text as="li" variant="body">
                Start the importer and wait for it to complete processing.
              </Text>
              <Text as="li" variant="body">
                Download the .zip file from the Importer.
              </Text>
              <Text as="li" variant="body">
                Drop the .zip file below to complete your import.
              </Text>
            </Box>

            <Text variant={"body"} sx={{ fontWeight: "bold" }}>
              For detailed steps with screenshots, refer to the help article for
              each app:
            </Text>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 1,
                mt: 1
              }}
            >
              {POPULAR_PROVIDERS.map((provider) => (
                <Button
                  key={provider.link}
                  variant="icon"
                  sx={{
                    borderRadius: "default",
                    border: "1px solid var(--border)",
                    textAlign: "left"
                  }}
                  onClick={() => window.open(provider.link, "_blank")}
                >
                  Import from {provider.title}
                </Button>
              ))}
            </Box>
          </Accordion>
          <Flex
            {...getRootProps()}
            data-test-id="import-dialog-select-files"
            sx={{
              justifyContent: "center",
              alignItems: "center",
              minHeight: 200,
              flexShrink: 0,
              width: "full",
              border: "2px dashed var(--border)",
              borderRadius: "default",
              mt: 2,
              flexDirection: "column"
            }}
          >
            <Input {...getInputProps()} />
            <Text variant="body" sx={{ textAlign: "center" }}>
              {isDragActive
                ? strings.dropFilesHere()
                : strings.dragAndDropFiles()}
              <br />
              <Text variant="subBody">{strings.onlyZipSupported()}</Text>
            </Text>
            <Box sx={{ display: "flex", flexWrap: "wrap", mt: 2 }}>
              {files.map((file, i) => (
                <Text
                  key={file.name}
                  p={1}
                  sx={{
                    ":hover": { bg: "hover" },
                    cursor: "pointer",
                    borderRadius: "default"
                  }}
                  onClick={() => {
                    setFiles((files) => {
                      const cloned = files.slice();
                      cloned.splice(i, 1);
                      return cloned;
                    });
                  }}
                  variant="body"
                  title="Click to remove"
                >
                  {file.name}
                </Text>
              ))}
            </Box>
          </Flex>
          {/* <Flex my={1} sx={{ flexDirection: "column" }}>
            
          </Flex> */}
          <Button
            variant="accent"
            sx={{ alignSelf: "end", mt: 1 }}
            onClick={async () => {
              setIsDone(false);
              setIsImporting(true);

              await db.syncer?.acquireLock(async () => {
                try {
                  for await (const message of importFiles(files)) {
                    switch (message.type) {
                      case "error":
                        setErrors((errors) => [...errors, message.error]);
                        break;
                      case "progress": {
                        const { count } = message;
                        if (notesCounter.current)
                          notesCounter.current.innerText = `${count}`;
                        break;
                      }
                    }
                  }
                } catch (e) {
                  console.error(e);
                  if (e instanceof Error) {
                    setErrors((errors) => [...errors, e as Error]);
                  }
                }
              });

              await useAppStore.getState().refresh();

              setIsDone(true);
              setIsImporting(false);
            }}
            disabled={!files.length}
          >
            {files.length > 0
              ? "Start import"
              : "Select files to start importing"}
          </Button>
        </>
      )}
    </Flex>
  );
}
