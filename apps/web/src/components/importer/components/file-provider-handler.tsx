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

import {
  IFileProvider,
  ProviderSettings,
  transform
} from "@notesnook-importer/core";
import { formatBytes, getFormattedDate } from "@notesnook/common";
import { ScrollContainer } from "@notesnook/ui";
import { Button, Flex, Text } from "@theme-ui/components";
import { xxhash64 } from "hash-wasm";
import { useEffect, useRef, useState } from "react";
import { importNote } from "../../../utils/importer";
import { PromptDialog } from "../../../dialogs/prompt";
import { ImporterSqliteAdapter } from "../../../common/sqlite/importer-sqlite-adapter";
import Accordion from "../../accordion";
import { TransformResult } from "../types";
import { useStore as useAppStore } from "../../../stores/app-store";
import { strings } from "@notesnook/intl";
import { showFilePicker } from "../../../utils/file-picker";

type FileProviderHandlerProps = {
  provider: IFileProvider;
  onTransformFinished: (result: TransformResult) => void;
};

type Progress = {
  total: number;
  done: number;
};

type LogMessage = {
  type: "info" | "error";
  text: string;
  date: number;
};

export function FileProviderHandler(props: FileProviderHandlerProps) {
  const { provider, onTransformFinished } = props;
  const [files, setFiles] = useState<File[]>([]);
  const [filesProgress, setFilesProgress] = useState<Progress>({
    done: 0,
    total: 0
  });
  const [totalNoteCount, setTotalNoteCount] = useState(0);
  const [_, setCounter] = useState<number>(0);
  const logs = useRef<LogMessage[]>([]);

  useEffect(() => {
    setFiles([]);
  }, [provider]);

  async function onStartImport() {
    let totalNotes = 0;
    const errors: Error[] = [];
    const settings: ProviderSettings = {
      clientType: "browser",
      hasher: { type: "xxh64", hash: xxhash64 },
      storage: {
        clear: async () => undefined,
        get: async () => [],
        write: async (data) => {
          logs.current.push({
            type: "info",
            date: Date.now(),
            text: `Pushing ${data.title} into database`
          });

          const errors = await importNote(data);
          errors.forEach((error) =>
            logs.current.push({
              type: "error",
              date: Date.now(),
              text: `Error importing ${data.title}: ${error}`
            })
          );
        },
        iterate: async function* () {
          return null;
        }
      },
      log: (message) => {
        logs.current.push({
          type: "info",
          date: message.date,
          text: message.text
        });
        setCounter((s) => ++s);
      },
      reporter: () => {
        setTotalNoteCount(++totalNotes);
      },
      options: {
        onenote: {
          getPassword
        },
        colornote: {
          getPassword
        },
        applenotes: {
          adapter: new ImporterSqliteAdapter(),
          getPassword
        }
      }
    };

    setTotalNoteCount(0);
    setFilesProgress({
      total: files.length,
      done: 0
    });

    errors.push(
      ...(await transform(
        provider,
        files.map((f) => ({
          name: f.name,
          modifiedAt: f.lastModified,
          size: f.size,
          data: f
        })),
        settings
      ))
    );

    setFilesProgress({
      total: files.length,
      done: files.length
    });

    await useAppStore.getState().refresh();
    onTransformFinished({
      totalNotes,
      errors
    });
  }

  if (filesProgress.done) {
    return (
      <Flex sx={{ flexDirection: "column", alignItems: "stretch" }}>
        <Text variant="subtitle">
          Processing {filesProgress.done} of {filesProgress.total} file(s)
        </Text>
        <Text variant="body" sx={{ mt: 4, textAlign: "center" }}>
          Found {totalNoteCount} notes
        </Text>
        {logs.current.length > 0 && (
          <Accordion
            title="Logs"
            isClosed={false}
            sx={{
              border: "1px solid var(--border)",
              mt: 2
            }}
          >
            <ScrollContainer>
              <Text
                as="pre"
                variant="body"
                sx={{
                  fontFamily: "monospace",
                  maxHeight: 250,
                  p: 2
                }}
              >
                {logs.current.map((c, index) => (
                  <>
                    <span
                      key={index.toString()}
                      style={{
                        color:
                          c.type === "error"
                            ? "var(--paragraph-error)"
                            : "inherit"
                      }}
                    >
                      [{getFormattedDate(c.date, "date-time")}] {c.text}
                    </span>
                    <br />
                  </>
                ))}
              </Text>
            </ScrollContainer>
          </Accordion>
        )}
      </Flex>
    );
  }

  return (
    <Flex sx={{ flexDirection: "column", alignItems: "stretch" }}>
      <Text variant="subtitle">Select {provider.name} files</Text>
      <Text
        variant="body"
        as={"div"}
        sx={{ mt: 1, color: "paragraph", whiteSpace: "pre-wrap" }}
      >
        Check out our step-by-step guide on{" "}
        <a href={provider.helpLink} target="_blank" rel="noreferrer">
          how to import from {provider?.name}.
        </a>
      </Text>
      <Flex sx={{ mt: 1, gap: 1 }}>
        <Button
          variant="secondary"
          onClick={() =>
            showFilePicker({
              multiple: true,
              acceptedFileTypes: provider?.supportedExtensions
                ?.concat([".zip"])
                .join(",")
            }).then((newFiles) => {
              setFiles((files) => {
                const _files = [...files, ...newFiles];
                return _files;
              });
            })
          }
        >
          {strings.selectFiles()}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            showFilePicker({
              directory: true
            }).then((newFiles) => {
              setFiles((files) => {
                const _files = [...files, ...newFiles];
                return _files;
              });
            });
          }}
        >
          {strings.selectFolder()}
        </Button>
      </Flex>
      <Text variant="subBody" sx={{ mt: 1 }}>
        Only {provider?.supportedExtensions.join(", ")} files are supported.{" "}
        {provider?.supportedExtensions.includes(".zip") ? null : (
          <>
            You can also select .zip files containing{" "}
            {provider?.supportedExtensions.join(", ")} files.
          </>
        )}
        {provider.examples ? (
          <> For example, {provider.examples.join(", ")}</>
        ) : null}
      </Text>

      {files.length > 0 ? (
        <Accordion
          isClosed
          title={`${files.length} ${
            files.length > 1 ? "files" : "file"
          } selected`}
          sx={{
            border: "1px solid var(--border)",
            mt: 2,
            borderRadius: "default"
          }}
        >
          <Flex
            sx={{ flexDirection: "column", overflowY: "auto", maxHeight: 400 }}
          >
            {files.map((file, index) => (
              <Flex
                key={file.name}
                sx={{
                  p: 2,
                  bg: index % 2 ? "transparent" : "background-secondary",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  ":hover": {
                    bg: "hover"
                  }
                }}
                onClick={() => {
                  setFiles((files) => {
                    const _files = files.slice();
                    _files.splice(index, 1);
                    return _files;
                  });
                }}
                title="Click to remove"
              >
                <Text variant="body">{file.name}</Text>
                <Text variant="body">{formatBytes(file.size)}</Text>
              </Flex>
            ))}
          </Flex>
        </Accordion>
      ) : null}

      {!!files.length && (
        <>
          <Text
            variant="body"
            sx={{
              bg: "primary",
              color: "static",
              mt: 2,
              borderRadius: 5,
              p: 1
            }}
          >
            Please make sure you have at least{" "}
            {formatBytes(files.reduce((prev, file) => prev + file.size, 0))} of
            free space before proceeding.
          </Text>
          {provider.requiresNetwork ? (
            <Text
              variant="body"
              sx={{
                bg: "background-error",
                color: "paragraph-error",
                mt: 2,
                borderRadius: 5,
                p: 1
              }}
            >
              Please make sure you have good Internet access before proceeding.
              The importer may send network requests in order to download media
              resources such as images, files, and other attachments.
            </Text>
          ) : null}
          <Button
            variant="accent"
            sx={{ alignSelf: "center", mt: 2, px: 4 }}
            onClick={onStartImport}
          >
            Start importing
          </Button>
        </>
      )}
    </Flex>
  );
}

async function getPassword(filename: string) {
  const password = await PromptDialog.show({
    title: strings.passwordFor(filename),
    type: "password"
  });
  return password || undefined;
}
