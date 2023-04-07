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

import { useCallback, useRef, useState } from "react";
import { Flex, Text } from "@theme-ui/components";
import Dialog from "./dialog";
import { db } from "../../common/db";
import { useDropzone } from "react-dropzone";
import { Input } from "@theme-ui/components";
import Accordion from "../accordion";
import { store as appStore } from "../../stores/app-store";
import { importFiles } from "../../utils/importer";
import { Perform } from "../../common/dialog-controller";
import { pluralize } from "../../utils/string";

type ImportDialogProps = {
  onClose: Perform;
};
function ImportDialog(props: ImportDialogProps) {
  const [isDone, setIsDone] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Error[]>([]);
  const notesCounter = useRef<HTMLSpanElement>(null);
  const importProgress = useRef<HTMLDivElement>(null);

  const onDrop = useCallback((acceptedFiles) => {
    setFiles((files) => {
      const newFiles = [...acceptedFiles, ...files];
      return newFiles;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: [".zip"]
  });

  return (
    <Dialog
      isOpen={true}
      title={isImporting ? "Importing your notes" : "Import notes"}
      description={
        isImporting
          ? "This might taking a while..."
          : isDone
          ? "You're all set up!"
          : "Use the Importer to import your notes from other notes apps."
      }
      negativeButton={
        isDone || isImporting
          ? undefined
          : {
              text: "Cancel",
              onClick: () => props.onClose(false)
            }
      }
      positiveButton={
        isDone
          ? {
              onClick: () => props.onClose(true),
              text: "Close"
            }
          : {
              onClick: async () => {
                setIsDone(false);
                setIsImporting(true);

                await db.syncer?.acquireLock(async () => {
                  try {
                    for await (const {
                      count,
                      filesRead,
                      totalFiles
                    } of importFiles(files)) {
                      if (notesCounter.current)
                        notesCounter.current.innerText = `${count}`;
                      if (importProgress.current)
                        importProgress.current.style.width = `${
                          (filesRead / totalFiles) * 100
                        }%`;
                    }
                  } catch (e) {
                    console.error(e);
                    if (e instanceof Error) {
                      setErrors((errors) => [...errors, e as Error]);
                    }
                  }
                });

                await appStore.refresh();

                setIsDone(true);
                setIsImporting(false);
              },
              text:
                files.length > 0
                  ? `Import notes from ${pluralize(
                      files.length,
                      "file",
                      "files"
                    )}`
                  : "Import",
              loading: isImporting,
              disabled: files.length <= 0 || isImporting
            }
      }
    >
      <Flex sx={{ flexDirection: "column", justifyContent: "center" }}>
        {isImporting ? (
          <>
            <Text variant="body" my={4} sx={{ textAlign: "center" }}>
              <span ref={notesCounter}>0</span> notes imported.
            </Text>

            <Flex
              ref={importProgress}
              sx={{
                alignSelf: "start",
                borderRadius: "default",
                height: "5px",
                bg: "primary",
                width: `0%`
              }}
            />
          </>
        ) : isDone ? (
          <>
            <Text variant="body" my={2} sx={{ textAlign: "center" }}>
              Import successful. {errors.length} errors occured.
            </Text>
            {errors.length > 0 && (
              <Flex my={1} bg="errorBg" p={1} sx={{ flexDirection: "column" }}>
                {errors.map((error) => (
                  <Text
                    key={error.message}
                    variant="body"
                    sx={{
                      color: "error"
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
              title={`${files.length} files selected`}
              isClosed={false}
            >
              <Flex
                {...getRootProps()}
                data-test-id="import-dialog-select-files"
                sx={{
                  justifyContent: "center",
                  alignItems: "center",
                  height: 200,
                  width: "full",
                  border: "2px dashed var(--border)",
                  borderRadius: "default",
                  mt: 1,
                  flexDirection: "column"
                }}
              >
                <Input {...getInputProps()} />
                <Text variant="body" sx={{ textAlign: "center" }}>
                  {isDragActive
                    ? "Drop the files here"
                    : "Drag & drop files here, or click to select files"}
                  <br />
                  <Text variant="subBody">Only .zip files are supported.</Text>
                </Text>
              </Flex>
              <Flex my={1} sx={{ flexDirection: "column" }}>
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
                    ml={1}
                    title="Click to remove"
                  >
                    {file.name}
                  </Text>
                ))}
              </Flex>
            </Accordion>
            <Accordion title={`How do I get the .zip file?`} isClosed={true}>
              <Text className="selectable" as="ol" variant={"body"} my={1}>
                <Text as="li" variant={"body"}>
                  Go to{" "}
                  <a href="https://importer.notesnook.com/">
                    https://importer.notesnook.com/
                  </a>
                </Text>
                <Text as="li" variant={"body"}>
                  Select the notes app you want to import from
                </Text>
                <Text as="li" variant={"body"}>
                  Follow the next steps in the Importer to download the .zip
                  file
                </Text>
                <Text as="li" variant={"body"}>
                  Drag &amp; drop the downloaded .zip file above
                </Text>
              </Text>
            </Accordion>
          </>
        )}
      </Flex>
    </Dialog>
  );
}
export default ImportDialog;
