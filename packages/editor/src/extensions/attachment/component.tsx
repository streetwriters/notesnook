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

import { Box, Text } from "@theme-ui/components";
import { FileAttachment, AudioAttachment } from "./types.js";
import { useRef, useState, useEffect } from "react";
import { Icon } from "@notesnook/ui";
import { Icons } from "../../toolbar/icons.js";
import { ReactNodeViewProps } from "../react/index.js";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group.js";
import { DesktopOnly } from "../../components/responsive/index.js";
import { ToolbarGroupDefinition } from "../../toolbar/types.js";
import { toBlobURL, revokeBloburl } from "../../utils/downloader.js";

export function AttachmentComponent(
  props: ReactNodeViewProps<FileAttachment | AudioAttachment>
) {
  const { editor, node, selected } = props;
  const { filename, size, progress, mime, hash } = node.attrs;
  const elementRef = useRef<HTMLSpanElement>();
  const [isDragging, setIsDragging] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>();

  const isAudioFile = mime && mime.startsWith("audio/");

  useEffect(() => {
    if (isAudioFile && editor.storage?.getAttachmentData && hash) {
      editor.storage
        .getAttachmentData({
          type: "file",
          hash
        })
        .then((data: string | undefined) => {
          if (data) {
            try {
              const url = toBlobURL(data, "other", mime, hash);
              if (url) {
                setAudioSrc(url);
              }
            } catch (error) {
              console.error("Failed to create audio blob:", error);
            }
          }
        })
        .catch(console.error);
    }
  }, [isAudioFile, editor.storage, hash, mime]);

  useEffect(() => {
    return () => {
      if (audioSrc && hash) {
        revokeBloburl(hash);
      }
    };
  }, [audioSrc, hash]);

  return (
    <Box
      ref={elementRef}
      as="span"
      contentEditable={false}
      variant={"body"}
      sx={{
        display: "inline-flex",
        position: "relative",
        userSelect: "none",
        backgroundColor: "var(--background-secondary)",
        m: 1,
        borderRadius: "default",
        border: "1px solid var(--border)",
        borderColor: selected ? "accent" : "border",
        ":hover": {
          bg: "hover"
        },
        ...(isAudioFile && audioSrc
          ? {
              flexDirection: "column",
              p: 2,
              width: "50%"
            }
          : {
              justifyContent: "center",
              alignItems: "center",
              px: 1,
              cursor: "pointer",
              maxWidth: 250
            })
      }}
      title={!isAudioFile || !audioSrc ? filename : undefined}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      data-drag-handle
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: isAudioFile && audioSrc ? 1 : 0
        }}
      >
        <Icon
          path={Icons.attachment}
          size={isAudioFile && audioSrc ? 16 : 14}
        />
        <Text
          as="span"
          sx={{
            ml: "small",
            fontSize: "body",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            flex: isAudioFile && audioSrc ? 1 : "none"
          }}
        >
          {filename}
        </Text>
        <Text
          as="span"
          sx={{
            ml: 1,
            fontSize: "0.65rem",
            color: "var(--paragraph-secondary)",
            flexShrink: 0
          }}
        >
          {progress ? `${progress}%` : formatBytes(size)}
        </Text>
      </Box>
      {isAudioFile && audioSrc && (
        <Box
          sx={{
            width: "100%",
            "& audio": {
              width: "100%",
              height: "32px"
            }
          }}
        >
          <audio controls preload="metadata" src={audioSrc} />
        </Box>
      )}
      <DesktopOnly>
        {selected && !isDragging && (
          <ToolbarGroup
            editor={editor}
            groupId="attachmentTools"
            tools={
              isAudioFile
                ? editor.isEditable
                  ? ["removeAttachment", "downloadAttachment"]
                  : ["downloadAttachment"]
                : editor.isEditable
                ? [
                    "removeAttachment",
                    "downloadAttachment",
                    "previewAttachment"
                  ]
                : ["downloadAttachment", "previewAttachment"]
            }
            sx={{
              boxShadow: "menu",
              borderRadius: "default",
              bg: "background",
              position: "absolute",
              top: -35
            }}
          />
        )}
      </DesktopOnly>
    </Box>
  );
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0B";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "K", "M", "G", "T", "P", "E", "Z", "Y"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + sizes[i];
}
