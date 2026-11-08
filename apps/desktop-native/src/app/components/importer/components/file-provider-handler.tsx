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
import { Button, Flex, ScrollContainer, Text } from "@ui";
import { files as platformFiles, type PickedFile } from "@platform";
import { xxhash64 } from "../xxhash";
import { useEffect, useRef, useState } from "react";
import { LinkText } from "../../../dialogs/components/link-text";
import { importNote } from "../../../utils/importer";
import { PromptDialog } from "../../../dialogs/prompt";
import { Accordion } from "../../../dialogs/components/accordion";
import { TransformResult } from "../types";
import { useStore as useAppStore } from "../../../stores/app-store";
import { strings } from "@notesnook/intl";

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
  const [files, setFiles] = useState<PickedFile[]>([]);
  const [filesProgress, setFilesProgress] = useState<Progress>({
    done: 0,
    total: 0
  });
  const [totalNoteCount, setTotalNoteCount] = useState(0);
  const [_, setCounter] = useState<number>(0);
  const logs = useRef<LogMessage[]>([]);

  const onSelectFiles = async () => {
    const picked = await platformFiles.pick({
      acceptedFileTypes: (provider?.supportedExtensions || [])
        .concat([".zip"])
        .join(","),
      multiple: true
    });
    if (picked.length) setFiles((files) => [...picked, ...files]);
  };

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
          yield* [] as never[];
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
        modifiedAt: Date.now(),
        size: file.size,
        data: file as unknown as File
      };
      errors.push(...(await transform(provider, [providerFile], settings)));
    }
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
          {strings.processingFiles(filesProgress.done, filesProgress.total)}
        </Text>
        <Text variant="body" sx={{ mt: 4, textAlign: "center" }}>
          {strings.foundNotes(totalNoteCount)}
        </Text>
        {logs.current.length > 0 && (
          <Accordion
            title={strings.logs()}
            isClosed={false}
            sx={{
              border: "1px solid",
              borderColor: "border",
              mt: 2
            }}
          >
            <ScrollContainer>
              <Text
                variant="body"
                selectable
                sx={{ fontFamily: "monospace", p: 2, whiteSpace: "pre-wrap" }}
              >
                {logs.current
                  .map(
                    (c) =>
                      `[${getFormattedDate(c.date, "date-time")}] ${c.text}`
                  )
                  .join("\n")}
              </Text>
            </ScrollContainer>
          </Accordion>
        )}
      </Flex>
    );
  }

  return (
    <Flex sx={{ flexDirection: "column", alignItems: "stretch" }}>
      <Text variant="subtitle">
        {strings.selectProviderFiles(provider.name)}
      </Text>
      <Text
        variant="body"
        sx={{ mt: 1, color: "paragraph", whiteSpace: "pre-wrap" }}
      >
        {strings.checkOutOurStepByStepGuideOn()}{" "}
        <LinkText href={provider.helpLink}>
          {strings.howToImportFrom(provider?.name)}
        </LinkText>
      </Text>
      <Flex
        onPress={onSelectFiles}
        sx={{
          justifyContent: "center",
          alignItems: "center",
          height: 100,
          border: "2px dashed",
          borderColor: "border",
          borderRadius: "default",
          mt: 2,
          cursor: "pointer",
          ":hover": { bg: "background-secondary" }
        }}
      >
        <Text variant="body" sx={{ textAlign: "center" }}>
          {strings.dragDropFilesHere()}
        </Text>
        <Text variant="subBody" sx={{ textAlign: "center" }}>
          {`${strings.onlySupportedExtensions(
            provider?.supportedExtensions.join(", ")
          )} ${
            provider?.supportedExtensions.includes(".zip")
              ? ""
              : strings.canAlsoSelectZipFiles(
                  provider?.supportedExtensions.join(", ")
                )
          }`}
        </Text>
        {provider.examples ? (
          <Text variant="subBody" sx={{ textAlign: "center" }}>
            {strings.forExampleExtensions(provider.examples.join(", "))}
          </Text>
        ) : null}
      </Flex>

      {files.length > 0 ? (
        <Accordion
          isClosed
          title={strings.filesSelected(files.length)}
          sx={{
            border: "1px solid",
            borderColor: "border",
            mt: 2,
            borderRadius: "default"
          }}
        >
          <ScrollContainer sx={{ maxHeight: 400 }}>
            <Flex sx={{ flexDirection: "column" }}>
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
                  onPress={() => {
                    setFiles((files) => {
                      const _files = files.slice();
                      _files.splice(index, 1);
                      return _files;
                    });
                  }}
                  title={strings.clickToRemove()}
                >
                  <Text variant="body">{file.name}</Text>
                  <Text variant="body">{formatBytes(file.size)}</Text>
                </Flex>
              ))}
            </Flex>
          </ScrollContainer>
        </Accordion>
      ) : null}

      {!!files.length && (
        <Flex sx={{ flexDirection: "column" }}>
          <Text
            variant="body"
            sx={{
              bg: "accent",
              color: "accentForeground",
              mt: 2,
              borderRadius: 5,
              p: 1
            }}
          >
            {strings.freeSpaceWarning(
              formatBytes(files.reduce((prev, file) => prev + file.size, 0))
            )}
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
              {strings.networkWarningForImport()}
            </Text>
          ) : null}
          <Button
            variant="accent"
            sx={{ alignSelf: "center", mt: 2, px: 4 }}
            onPress={onStartImport}
          >
            <Text>{strings.startImporting()}</Text>
          </Button>
        </Flex>
      )}
    </Flex>
  );
}
