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
  IFile,
  IFileProvider,
  ProviderSettings,
  transform
} from "@notesnook-importer/core";
import { formatBytes, getFormattedDate } from "@notesnook/common";
import { Box, Button, Flex, Input, Text } from "@theme-ui/components";
import { xxhash64 } from "hash-wasm";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { importNote } from "../../../utils/importer";
import { PromptDialog } from "../../../dialogs/prompt";
import { CardTitle, ImporterCard, LogsBox } from "./card";
import { ImportResult } from "./import-result";
import { TransformResult } from "../types";
import { useStore as useAppStore } from "../../../stores/app-store";
import { strings } from "@notesnook/intl";

type FileProviderHandlerProps = {
  provider: IFileProvider;
  result?: TransformResult;
  onTransformFinished: (result: TransformResult) => void;
  onReset: () => void;
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
  const { provider, result, onTransformFinished, onReset } = props;
  const [files, setFiles] = useState<File[]>([]);
  const [filesProgress, setFilesProgress] = useState<Progress>({
    done: 0,
    total: 0
  });
  const [totalNoteCount, setTotalNoteCount] = useState(0);
  const [_, setCounter] = useState<number>(0);
  const logs = useRef<LogMessage[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((files) => {
      const newFiles = [...acceptedFiles, ...files];
      return newFiles;
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      file: provider?.supportedExtensions?.concat([".zip"])
    }
  });

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
        colornote: {
          getPassword: async (filename: string) => {
            const password = await PromptDialog.show({
              title: strings.colorNotePasswordFor(filename),
              description: strings.colorNotPasswordForDesc(),
              label: strings.enterPassword()
            });
            return password || undefined;
          }
        }
      }
    };

    setTotalNoteCount(0);
    setFilesProgress({
      total: files.length,
      done: 0
    });

    for (const file of files) {
      setFilesProgress((p) => ({
        ...p,
        done: p.done + 1
      }));

      const providerFile: IFile = {
        name: file.name,
        modifiedAt: file.lastModified,
        size: file.size,
        data: file
      };
      errors.push(...(await transform(provider, [providerFile], settings)));
    }
    await useAppStore.getState().refresh();
    onTransformFinished({
      totalNotes,
      errors
    });
  }

  const logLines = logs.current.map((c, index) => (
    <Box
      key={index.toString()}
      sx={{ color: c.type === "error" ? "paragraph-error" : "inherit" }}
    >
      [{getFormattedDate(c.date, "date-time")}] {c.text}
    </Box>
  ));

  if (result) {
    return (
      <ImportResult
        result={result}
        provider={provider}
        filesCount={filesProgress.total}
        logs={logLines.length > 0 ? logLines : undefined}
        onReset={onReset}
      />
    );
  }

  if (filesProgress.done) {
    return (
      <ImporterCard>
        <CardTitle
          title={strings.processingFiles(
            filesProgress.done,
            filesProgress.total
          )}
        >
          {strings.foundNotes(totalNoteCount)}
        </CardTitle>
        {logLines.length > 0 && <LogsBox>{logLines}</LogsBox>}
      </ImporterCard>
    );
  }

  const totalSize = formatBytes(
    files.reduce((prev, file) => prev + file.size, 0)
  );

  return (
    <>
      <ImporterCard>
        <CardTitle title={strings.selectProviderFiles(provider.name)}>
          {strings.checkOutOurStepByStepGuideOn()}{" "}
          <a href={provider.helpLink} target="_blank" rel="noreferrer">
            {strings.howToImportFrom(provider?.name)}
          </a>
        </CardTitle>
        <Flex
          {...getRootProps()}
          sx={{
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "spacing2",
            px: "spacing5",
            py: "spacing6",
            border: "1.5px dashed",
            borderColor: "border",
            borderRadius: "radius2",
            fontSize: "xs",
            textAlign: "center",
            cursor: "pointer",
            bg: isDragActive ? "hover" : "transparent",
            ":hover": { bg: "hover" }
          }}
        >
          <Input {...getInputProps()} />
          <Text sx={{ fontWeight: 500, lineHeight: 1, color: "heading" }}>
            {isDragActive
              ? strings.dropTheFilesHere()
              : strings.dragDropFilesHere()}
          </Text>
          <Text sx={{ lineHeight: 1.3, color: "paragraph" }}>
            {strings.onlySupportedExtensions(
              provider?.supportedExtensions.join(", ")
            )}{" "}
            {provider?.supportedExtensions.includes(".zip") ? null : (
              <>
                {strings.canAlsoSelectZipFiles(
                  provider?.supportedExtensions.join(", ")
                )}
              </>
            )}{" "}
            {provider.examples ? (
              <>{strings.forExampleExtensions(provider.examples.join(", "))}</>
            ) : null}
          </Text>
        </Flex>
      </ImporterCard>

      {files.length > 0 ? (
        <ImporterCard>
          <Text
            sx={{
              fontSize: "sm",
              fontWeight: 500,
              lineHeight: 1,
              color: "heading"
            }}
          >
            {strings.filesSelected(files.length)}
          </Text>
          <Flex
            sx={{
              flexDirection: "column",
              gap: "spacing2",
              overflowY: "auto",
              maxHeight: 400
            }}
          >
            {files.map((file, index) => (
              <Flex
                key={file.name}
                sx={{
                  px: "spacing4",
                  py: "spacing3",
                  bg: "background-secondary",
                  borderRadius: "radius1",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "spacing4",
                  fontSize: "xs",
                  lineHeight: 1.3,
                  cursor: "pointer",
                  ":hover": { bg: "hover" }
                }}
                onClick={() => {
                  setFiles((files) => {
                    const _files = files.slice();
                    _files.splice(index, 1);
                    return _files;
                  });
                }}
                title={strings.clickToRemove()}
              >
                <Text sx={{ color: "paragraph" }}>{file.name}</Text>
                <Text sx={{ color: "paragraph-secondary", flexShrink: 0 }}>
                  {formatBytes(file.size)}
                </Text>
              </Flex>
            ))}
          </Flex>
          <Text sx={{ fontSize: "xs", lineHeight: 1.3, color: "paragraph" }}>
            {strings.freeSpaceWarning(totalSize)}
          </Text>
          {provider.requiresNetwork ? (
            <Box
              sx={{
                fontSize: "xs",
                lineHeight: 1.3,
                color: "paragraph-error",
                bg: "background-error",
                border: "1px solid",
                borderColor: "border-error",
                borderRadius: "radius1",
                p: "spacing4"
              }}
            >
              {strings.networkWarningForImport()}
            </Box>
          ) : null}
          <Button
            variant="new_accent"
            sx={{ alignSelf: "flex-start", px: "spacing4" }}
            onClick={onStartImport}
          >
            {strings.startImporting()}
          </Button>
        </ImporterCard>
      ) : null}
    </>
  );
}
