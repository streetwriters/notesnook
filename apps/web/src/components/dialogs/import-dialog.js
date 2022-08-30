/* This file is part of the Notesnook project (https://notesnook.com/)
 *
 * Copyright (C) 2022 Streetwriters (Private) Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Flex, Text } from "@streetwriters/rebass";
import * as Icon from "../icons";
import Dialog from "./dialog";
import { db } from "../../common/db";
import { useDropzone } from "react-dropzone";
import { Input } from "@streetwriters/rebass-forms";
import Accordion from "../accordion";
import { store as appStore } from "../../stores/app-store";
import { Importer } from "../../utils/importer";

function ImportDialog(props) {
  const [progress, setProgress] = useState({
    total: 0,
    current: 0,
    done: false
  });
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [errors, setErrors] = useState([]);
  const selectedNotes = useMemo(() => notes.filter((n) => n.selected), [notes]);

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

  useEffect(() => {
    (async () => {
      const notes = await Importer.getNotesFromImport(files);
      setNotes(
        notes.map((note) => {
          note.selected = true;
          return note;
        })
      );
    })();
  }, [files]);

  return (
    <Dialog
      isOpen={true}
      title={"Import notes"}
      description="Use the Importer to import your notes from other notes apps."
      onClose={props.onClose}
      negativeButton={
        progress.done
          ? undefined
          : {
              text: "Cancel",
              onClick: props.onClose
            }
      }
      positiveButton={
        progress.done
          ? {
              onClick: props.onClose,
              text: "Close"
            }
          : {
              onClick: async () => {
                await db.syncer.acquireLock(async () => {
                  setProgress({ total: selectedNotes.length, current: 0 });
                  for (let note of selectedNotes) {
                    try {
                      await Importer.importNote(note);
                    } catch (e) {
                      e.message = `${e.message} (${note.title})`;
                      setErrors((errors) => [...errors, e]);
                    } finally {
                      setProgress((p) => ({ ...p, current: ++p.current }));
                    }
                  }
                  await appStore.refresh();
                  setProgress({ done: true });
                });
              },
              text:
                notes.length > 0
                  ? `Import ${selectedNotes.length} notes`
                  : "Import",
              loading: progress.current > 0,
              disabled: notes.length <= 0 || progress.current > 0
            }
      }
    >
      <Flex flexDirection="column" justifyContent="center">
        {progress.current > 0 ? (
          <>
            <Text variant="body" my={4} sx={{ textAlign: "center" }}>
              Importing notes {progress.current} of {progress.total}...
            </Text>
          </>
        ) : progress.done ? (
          <>
            <Text variant="body" my={2} sx={{ textAlign: "center" }}>
              Imported {notes.length - errors.length} notes. {errors.length}{" "}
              errors occured.
            </Text>
            {errors.length > 0 && (
              <Flex flexDirection="column" my={1} bg="errorBg" p={1}>
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
                flexDirection="column"
                data-test-id="import-dialog-select-files"
                sx={{
                  justifyContent: "center",
                  alignItems: "center",
                  height: 200,
                  width: "full",
                  border: "2px dashed var(--border)",
                  borderRadius: "default",
                  mt: 1
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
              <Flex flexDirection="column" mt={1}>
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
            {files.length > 0 && (
              <Accordion
                title={`${notes.length} notes found`}
                sx={{ mt: 1 }}
                testId={"importer-dialog-notes"}
              >
                <Flex flexDirection="column" mt={1}>
                  {notes.map((note, i) => (
                    <Flex
                      key={note.title}
                      data-test-id={`note-${i}`}
                      p={1}
                      sx={{
                        ":hover": { bg: "hover" },
                        cursor: "pointer",
                        borderRadius: "default"
                      }}
                      onClick={() => {
                        setNotes((notes) => {
                          const cloned = notes.slice();
                          cloned[i].selected = !cloned[i].selected;
                          return cloned;
                        });
                      }}
                    >
                      {note.selected ? (
                        <Icon.CheckCircle color="primary" size={16} />
                      ) : (
                        <Icon.CheckCircleOutline size={16} />
                      )}
                      <Text variant="body" ml={1}>
                        {note.title}
                      </Text>
                    </Flex>
                  ))}
                </Flex>
              </Accordion>
            )}
          </>
        )}
      </Flex>
    </Dialog>
  );
}
export default ImportDialog;
