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

type FileStatus = "pending" | "compressing" | "encrypting" | "done" | "error";

type FileState = {
  file: File;
  status: FileStatus;
  progress: number;
  error?: string;
  compress: boolean;
};

type AttachFilesDialogProps = BaseDialogProps<false> & {
  files: File[];
  skipSpecialImageHandling?: boolean;
  onDone: (attachments: Attachment[]) => void;
};

const COUNTDOWN_SECONDS = 5;

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
    const [countdown, setCountdown] = useState(-1);
    const countdownRef = useRef<ReturnType<typeof setInterval>>();
    const processingRef = useRef(false);

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
      if (countdown < 0) return;

      if (countdown === 0) {
        onClose(false);
        return;
      }

      countdownRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);

      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }, [countdown]);

    useEffect(() => {
      if (showCompressionPrompt || processingRef.current) return;

      processingRef.current = true;

      const shouldCompress: boolean[] = fileStates.map((s) => !!s.compress);

      (async () => {
        const attachments: Attachment[] = [];
        let hasError = false;

        for await (const message of attachFiles(
          files,
          shouldCompress,
          skipSpecialImageHandling
        )) {
          const { index } = message;
          switch (message.type) {
            case "compressing":
              setFileStates((prev) =>
                prev.map((s, i) =>
                  i === index
                    ? { ...s, status: "compressing" as FileStatus }
                    : s
                )
              );
              break;
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
        if (!hasError) setCountdown(COUNTDOWN_SECONDS);
      })();
    }, [showCompressionPrompt]);

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
            : countdown >= 0
            ? {
                text: strings.closeCountdown(countdown),
                onClick: () => onClose(false)
              }
            : undefined
        }
        negativeButton={
          countdown < 0
            ? {
                text: strings.close(),
                onClick: () => onClose(false)
              }
            : undefined
        }
      >
        <ScrollContainer
          style={{
            maxHeight: 350,
            display: "flex",
            flexDirection: "column"
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
  const { file, status, progress, error, compress } = state;
  const isImage = file.type.startsWith("image/");
  const thumbnail = useMemo(
    () => (isImage ? URL.createObjectURL(file) : undefined),
    [file, isImage]
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
          {file.name}
        </Text>
        <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
          {formatBytes(file.size)}
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
        {showCompressionToggle && isImage ? (
          <Switch
            sx={{
              m: 0,
              bg: compress ? "accent" : "icon-secondary",
              flexShrink: 0,
              scale: 0.75
            }}
            checked={compress}
            onChange={onToggleCompress}
          />
        ) : showCompressionToggle && !isImage ? (
          <Text variant="subBody" sx={{ color: "paragraph-secondary" }}>
            N/A
          </Text>
        ) : status === "done" ? (
          <CheckCircle size={20} color="accent" />
        ) : status === "error" ? (
          <CloseCircle size={20} color="accent-error" />
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
