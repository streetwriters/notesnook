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

import { useCallback, useEffect, useMemo, useState } from "react";
import Dialog from "../components/dialog";
import { Flex, Image, Switch, Text } from "@theme-ui/components";
import { formatBytes } from "@notesnook/common";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { strings } from "@notesnook/intl";
import { checkFeature } from "../common";
import { AppEventManager, AppEvents } from "../common/app-events";
import { attachFiles, AttachmentProgress } from "../components/editor/picker";
import Config from "../utils/config";
import { ImageCompressionOptions } from "../stores/setting-store";
import { Attachment } from "@notesnook/editor";
import {
  CheckCircle,
  File as FileIcon,
  CloseCircle
} from "../components/icons";
import { compressImage } from "../utils/image-compressor";
import Queue from "p-queue";

type FileStatus = "pending" | "compressing" | "encrypting" | "done" | "error";

type FileState = {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  compress: boolean;
  compressedFile?: File;
};

type AttachFilesDialogProps = BaseDialogProps<false> & {
  files: File[];
  skipSpecialImageHandling?: boolean;
  onDone: (attachments: Attachment[]) => void;
};

export const AttachFilesDialog = DialogManager.register(
  function AttachFilesDialog({
    files,
    skipSpecialImageHandling,
    onDone,
    onClose
  }: AttachFilesDialogProps) {
    const hasImages = files.some((f) => f.type.startsWith("image/"));
    const imageCompressionConfig = Config.get<ImageCompressionOptions>(
      "imageCompression",
      ImageCompressionOptions.ASK_EVERY_TIME
    );
    const [fileStates, setFileStates] = useState<FileState[]>(() =>
      files
        .sort((a, b) => {
          const aIsImage = a.type.startsWith("image/");
          const bIsImage = b.type.startsWith("image/");
          if (aIsImage && !bIsImage) return -1;
          if (!aIsImage && bIsImage) return 1;
          return a.type.localeCompare(b.type);
        })
        .map((file) => ({
          file,
          status: "pending",
          progress: 0,
          compress: file.type.startsWith("image/")
            ? imageCompressionConfig !== ImageCompressionOptions.DISABLE
            : false
        }))
    );
    const isCompressionOptional =
      hasImages &&
      imageCompressionConfig === ImageCompressionOptions.ASK_EVERY_TIME;
    const isProcessing = fileStates.some(
      (f) => f.status === "compressing" || f.status === "encrypting"
    );
    const isDone = fileStates.every(
      (f) => f.status === "done" || f.status === "error"
    );

    useEffect(() => {
      const event = AppEventManager.subscribe(
        AppEvents.UPDATE_ATTACHMENT_PROGRESS,
        ({ type, total, loaded, file }: AttachmentProgress) => {
          if (type !== "encrypt") return;

          setFileStates((prev) => {
            const index = prev.findIndex((s) => s.file === file);
            if (index === -1) return prev;
            return updateFileStates(prev, index, {
              progress: Math.round((loaded / total) * 100)
            });
          });
        }
      );
      return () => {
        event.unsubscribe();
      };
    }, []);

    const compressFiles = useCallback(async () => {
      setFileStates((prev) =>
        prev.map((s) => ({
          ...s,
          status: s.compressedFile || !s.compress ? s.status : "compressing"
        }))
      );

      const queue = new Queue({ concurrency: 8 });

      for (const [index, state] of fileStates.entries()) {
        if (state.compressedFile || !state.compress) continue;

        await queue.add(async () => {
          try {
            const compressed = await compressImage(state.file, {
              maxWidth: (naturalWidth) => Math.min(1920, naturalWidth * 0.7),
              width: (naturalWidth) => naturalWidth,
              height: (_, naturalHeight) => naturalHeight,
              resize: "contain",
              quality: 0.7
            });
            const compressedFile = new File([compressed], state.file.name, {
              lastModified: state.file.lastModified,
              type: state.file.type
            });
            setFileStates((prev) =>
              updateFileStates(prev, index, {
                status: "pending",
                compressedFile
              })
            );
          } catch (e) {
            const error = (e as Error).message || strings.compressionFailed();
            setFileStates((prev) =>
              updateFileStates(prev, index, { status: "error", error })
            );
          }
        });
      }

      await queue.onIdle();
    }, [fileStates]);

    const processFiles = useCallback(async () => {
      const attachments: Attachment[] = [];
      const validIndices = fileStates
        .map((s, i) => (s.status === "error" ? -1 : i))
        .filter((i) => i !== -1);
      const filesToAttach = validIndices.map((i) => {
        const state = fileStates[i];
        return state.compress && state.compressedFile
          ? state.compressedFile
          : state.file;
      });

      await attachFiles(
        filesToAttach,
        (message) => {
          const index = validIndices[message.index];
          switch (message.type) {
            case "encrypting":
              setFileStates((prev) =>
                updateFileStates(prev, index, {
                  status: "encrypting",
                  progress: 0
                })
              );
              break;
            case "done":
              if (message.attachment) attachments.push(message.attachment);
              setFileStates((prev) =>
                updateFileStates(prev, index, { status: "done" })
              );
              break;
            case "error":
              setFileStates((prev) =>
                updateFileStates(prev, index, {
                  status: "error",
                  error: message.error
                })
              );
              break;
          }
        },
        skipSpecialImageHandling
      );

      onDone(attachments);

      const hasError = fileStates.some((s) => s.status === "error");
      if (fileStates.length === 1 && !hasError) onClose(false);
    }, [fileStates, onClose, onDone, skipSpecialImageHandling]);

    return (
      <Dialog
        isOpen={true}
        title={strings.attachingFiles()}
        onOpen={async () => {
          await compressFiles();
          if (!isCompressionOptional) await processFiles();
        }}
        onClose={() => {
          if (isProcessing) return;
          onClose(false);
        }}
        width={500}
        positiveButton={
          isCompressionOptional && !isDone
            ? {
                text: strings.insert(),
                disabled: isProcessing,
                onClick: async () => {
                  await processFiles();
                }
              }
            : undefined
        }
        negativeButton={{
          text: strings.close(),
          disabled: isProcessing,
          onClick: () => onClose(false)
        }}
      >
        <Flex
          sx={{
            alignItems: "center",
            py: 1,
            px: 1,
            gap: 2
          }}
        >
          <Text variant="body" sx={{ color: "paragraph-secondary", flex: 1 }}>
            {strings.name()}
          </Text>
          <Text variant="body" sx={{ color: "paragraph-secondary" }}>
            {isCompressionOptional && !isProcessing && !isDone
              ? strings.compress()
              : strings.status()}
          </Text>
        </Flex>
        {fileStates.map((state, index) => (
          <FileRow
            key={`${state.file.name}-${index}`}
            state={state}
            showDivider={fileStates.length > 1}
            showCompressionToggle={isCompressionOptional}
            onToggleCompress={async () => {
              if (
                !(await checkFeature("fullQualityImages", { type: "toast" }))
              ) {
                return;
              }

              setFileStates((prev) =>
                updateFileStates(prev, index, { compress: !state.compress })
              );
            }}
          />
        ))}
      </Dialog>
    );
  }
);

function FileRow({
  state,
  showDivider,
  showCompressionToggle,
  onToggleCompress
}: {
  state: FileState;
  showDivider?: boolean;
  showCompressionToggle?: boolean;
  onToggleCompress?: () => void;
}) {
  const { file, status, progress, error, compress, compressedFile } = state;
  const isImage = file.type.startsWith("image/");
  const activeFile = compress && compressedFile ? compressedFile : file;
  const thumbnail = useMemo(
    () => (isImage ? URL.createObjectURL(activeFile) : undefined),
    [activeFile, isImage]
  );

  useEffect(() => {
    return () => {
      if (thumbnail) URL.revokeObjectURL(thumbnail);
    };
  }, [thumbnail]);

  return (
    <Flex
      sx={{
        alignItems: "center",
        py: 1,
        px: 1,
        gap: 2,
        borderBottom: showDivider ? "1px solid var(--border)" : undefined
      }}
    >
      {thumbnail ? (
        <Image
          src={thumbnail}
          sx={{
            width: 40,
            height: 40,
            objectFit: "cover",
            borderRadius: "default",
            flexShrink: 0
          }}
        />
      ) : (
        <Flex
          sx={{
            width: 40,
            height: 40,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bg: "background-secondary",
            borderRadius: "default"
          }}
        >
          <FileIcon size={20} color="icon" />
        </Flex>
      )}

      <Flex sx={{ flex: 1, flexDirection: "column", minWidth: 0 }}>
        <Text
          variant="body"
          sx={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}
        >
          {activeFile.name}
        </Text>
        <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
          {formatBytes(activeFile.size)}
          {status === "error" ? ` — ${error}` : ""}
        </Text>
      </Flex>

      <Flex sx={{ flexShrink: 0, alignItems: "center" }}>
        {status === "error" ? (
          <CloseCircle size={20} color="accent-error" />
        ) : status === "done" ? (
          <CheckCircle size={20} color="accent" />
        ) : status === "encrypting" || status === "compressing" ? (
          <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
            {status === "compressing"
              ? `${strings.compressing()}`
              : status === "encrypting"
              ? `${strings.encrypting()} ${progress}%`
              : ""}
          </Text>
        ) : showCompressionToggle && isImage ? (
          <Switch
            sx={{
              m: 0,
              bg: compress ? "accent" : "icon-secondary",
              flexShrink: 0
            }}
            checked={compress}
            onChange={onToggleCompress}
          />
        ) : showCompressionToggle && !isImage ? (
          <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
            N/A
          </Text>
        ) : null}
      </Flex>
    </Flex>
  );
}

function updateFileStates(
  prev: FileState[],
  index: number,
  update: Partial<FileState>
) {
  const clone = prev.slice();
  clone[index] = { ...clone[index], ...update };
  return clone;
}
