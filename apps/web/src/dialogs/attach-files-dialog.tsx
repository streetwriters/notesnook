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

import { useEffect, useMemo, useRef, useState } from "react";
import Dialog from "../components/dialog";
import { ScrollContainer } from "@notesnook/ui";
import { Box, Flex, Image, Switch, Text } from "@theme-ui/components";
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
  Loading,
  File as FileIcon,
  CloseCircle
} from "../components/icons";
import { compressImage } from "../utils/image-compressor";

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
      files.map((file) => ({
        file,
        status: "pending",
        progress: 0,
        compress: file.type.startsWith("image/")
          ? imageCompressionConfig !== ImageCompressionOptions.DISABLE
          : false
      }))
    );
    const [showCompressionPrompt, setShowCompressionPrompt] = useState(
      hasImages &&
        imageCompressionConfig === ImageCompressionOptions.ASK_EVERY_TIME
    );
    const [isCompressionComplete, setIsCompresionComplete] = useState(false);
    const processingRef = useRef(false);

    async function compress(index: number, state: FileState) {
      if (state.compressedFile) return;
      if (!state.compress) return;

      setFileStates((prev) =>
        prev.map((s, idx) =>
          idx === index ? { ...s, status: "compressing" } : s
        )
      );

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
          prev.map((s, idx) =>
            idx === index
              ? {
                  ...s,
                  status: "pending",
                  compressedFile
                }
              : s
          )
        );
      } catch (e) {
        const error = (e as Error).message || strings.compressionFailed();
        setFileStates((prev) =>
          prev.map((s, idx) =>
            idx === index
              ? {
                  ...s,
                  status: "error",
                  error
                }
              : s
          )
        );
      }
    }

    useEffect(() => {
      const event = AppEventManager.subscribe(
        AppEvents.UPDATE_ATTACHMENT_PROGRESS,
        ({ type, total, loaded }: AttachmentProgress) => {
          if (type !== "encrypt") return;

          setFileStates((prev) =>
            prev.map((s) => {
              /**
               * only one file is encrypted at a time, so we can just update progress of the state with "encrypting" status
               */
              if (s.status !== "encrypting") return s;

              return {
                ...s,
                progress: Math.round((loaded / total) * 100)
              };
            })
          );
        }
      );
      return () => {
        event.unsubscribe();
      };
    }, []);

    useEffect(() => {
      (async () => {
        await Promise.all(
          fileStates.map(async (state, index) => {
            await compress(index, state);
          })
        );
        setIsCompresionComplete(true);
      })();
    }, []);

    useEffect(() => {
      if (
        !isCompressionComplete ||
        showCompressionPrompt ||
        processingRef.current
      ) {
        return;
      }

      processingRef.current = true;

      (async () => {
        const attachments: Attachment[] = [];
        let hasError = fileStates.some((s) => s.status === "error");
        const validIndices = fileStates
          .map((s, i) => (s.status === "error" ? -1 : i))
          .filter((i) => i !== -1);
        const filesToAttach = validIndices.map((i) => {
          const state = fileStates[i];
          return state.compress && state.compressedFile
            ? state.compressedFile
            : state.file;
        });

        for await (const message of attachFiles(
          filesToAttach,
          skipSpecialImageHandling
        )) {
          const index = validIndices[message.index];
          switch (message.type) {
            case "encrypting":
              setFileStates((prev) =>
                prev.map((s, i) =>
                  i === index
                    ? { ...s, status: "encrypting" as FileStatus, progress: 0 }
                    : s
                )
              );
              break;
            case "done":
              if (message.attachment) attachments.push(message.attachment);
              setFileStates((prev) =>
                prev.map((s, i) =>
                  i === index
                    ? {
                        ...s,
                        status: "done" as FileStatus
                      }
                    : s
                )
              );
              break;
            case "error":
              hasError = true;
              setFileStates((prev) =>
                prev.map((s, i) =>
                  i === index
                    ? {
                        ...s,
                        status: "error" as FileStatus,
                        error: message.error
                      }
                    : s
                )
              );
              break;
          }
        }

        onDone(attachments);
        if (files.length === 1 && !hasError) onClose(false);
      })();
    }, [showCompressionPrompt, isCompressionComplete]);

    return (
      <Dialog
        isOpen={true}
        title={
          showCompressionPrompt
            ? strings.imageCompression()
            : strings.attachingFiles()
        }
        description={
          showCompressionPrompt ? strings.imageCompressionDesc() : ""
        }
        onClose={() => onClose(false)}
        width={500}
        positiveButton={
          showCompressionPrompt
            ? {
                text: strings.done(),
                onClick: () => setShowCompressionPrompt(false)
              }
            : undefined
        }
        negativeButton={{
          text: strings.close(),
          onClick: () => onClose(false)
        }}
      >
        <ScrollContainer
          style={{
            maxHeight: 350,
            display: "flex",
            flexDirection: "column",
            position: "relative"
          }}
        >
          {fileStates.map((state, index) => (
            <FileRow
              key={`${state.file.name}-${index}`}
              state={state}
              showDivider={fileStates.length > 1}
              showCompressionToggle={showCompressionPrompt}
              onToggleCompress={async () => {
                if (
                  !(await checkFeature("fullQualityImages", { type: "toast" }))
                ) {
                  return;
                }

                setFileStates((prev) =>
                  prev.map((s, idx) =>
                    idx === index ? { ...s, compress: !s.compress } : s
                  )
                );
              }}
            />
          ))}
        </ScrollContainer>
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
          {status === "compressing"
            ? ` — ${strings.compressing()}...`
            : status === "encrypting"
            ? ` — ${strings.encrypting()} ${progress}%`
            : status === "error"
            ? ` — ${error}`
            : ""}
        </Text>
      </Flex>

      <Flex sx={{ flexShrink: 0, alignItems: "center" }}>
        {status === "error" ? (
          <CloseCircle size={20} color="accent-error" />
        ) : showCompressionToggle && isImage ? (
          <Switch
            sx={{
              m: 0,
              bg: compress ? "accent" : "icon-secondary",
              flexShrink: 0,
              scale: 0.75
            }}
            checked={compress}
            onChange={onToggleCompress}
            disabled={status === "compressing"}
          />
        ) : showCompressionToggle && !isImage ? (
          <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
            N/A
          </Text>
        ) : status === "done" ? (
          <CheckCircle size={20} color="accent" />
        ) : status === "encrypting" || status === "compressing" ? (
          <Flex sx={{ alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 60,
                height: 4,
                bg: "border",
                borderRadius: "full",
                overflow: "hidden"
              }}
            >
              <Box
                sx={{
                  width: `${status === "compressing" ? 50 : progress}%`,
                  height: "100%",
                  bg: "accent",
                  transition: "width 0.2s ease"
                }}
              />
            </Box>
          </Flex>
        ) : (
          <Loading size={16} color="icon" />
        )}
      </Flex>
    </Flex>
  );
}
