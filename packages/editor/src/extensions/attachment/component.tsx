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

export function AttachmentComponent(
  props: ReactNodeViewProps<FileAttachment | AudioAttachment>
) {
  const { editor, node, selected } = props;
  const { filename, size, progress, mime, hash } = node.attrs;
  const elementRef = useRef<HTMLSpanElement>();
  const [isDragging, setIsDragging] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string>();

  // Check if this is an audio file
  const isAudioFile = mime && mime.startsWith("audio/");

  // Load audio data if it's an audio file
  useEffect(() => {
    if (isAudioFile && editor.storage?.getAttachmentData && hash) {
      editor.storage
        .getAttachmentData({
          type: "file",
          hash
        })
        .then((data: string | undefined) => {
          if (data) {
            // Convert base64 data to blob URL for audio playback
            try {
              const byteCharacters = atob(data.split(",")[1] || data);
              const byteNumbers = new Array(byteCharacters.length);
              for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
              }
              const byteArray = new Uint8Array(byteNumbers);
              const blob = new Blob([byteArray], { type: mime });
              const url = URL.createObjectURL(blob);
              setAudioSrc(url);
            } catch (error) {
              console.error("Failed to create audio blob:", error);
            }
          }
        })
        .catch(console.error);
    }
  }, [isAudioFile, editor.storage, hash, mime]);

  // Clean up blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
    };
  }, [audioSrc]);

  if (isAudioFile && audioSrc) {
    return (
      <Box
        ref={elementRef}
        as="span"
        contentEditable={false}
        variant={"body"}
        sx={{
          display: "inline-flex",
          flexDirection: "column",
          position: "relative",
          userSelect: "none",
          backgroundColor: "var(--background-secondary)",
          p: 2,
          m: 1,
          borderRadius: "default",
          border: "1px solid var(--border)",
          maxWidth: 350,
          borderColor: selected ? "accent" : "border",
          ":hover": {
            bg: "hover"
          }
        }}
        data-drag-handle
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setIsDragging(false)}
      >
        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Icon path={Icons.attachment} size={16} />
          <Text
            as="span"
            sx={{
              ml: "small",
              fontSize: "body",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              flex: 1
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

        <DesktopOnly>
          {selected && !isDragging && (
            <ToolbarGroup
              editor={editor}
              groupId="attachmentTools"
              tools={
                editor.isEditable
                  ? ["removeAttachment", "downloadAttachment"]
                  : ["downloadAttachment"]
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

  return (
    <Box
      ref={elementRef}
      as="span"
      contentEditable={false}
      variant={"body"}
      sx={{
        display: "inline-flex",
        position: "relative",
        justifyContent: "center",
        userSelect: "none",
        alignItems: "center",
        backgroundColor: "var(--background-secondary)",
        px: 1,
        m: 1,
        borderRadius: "default",
        border: "1px solid var(--border)",
        cursor: "pointer",
        maxWidth: 250,
        borderColor: selected ? "accent" : "border",
        ":hover": {
          bg: "hover"
        }
      }}
      title={filename}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      data-drag-handle
    >
      <Icon path={Icons.attachment} size={14} />
      <Text
        as="span"
        sx={{
          ml: "small",
          fontSize: "body",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          overflow: "hidden"
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
      <DesktopOnly>
        {selected && !isDragging && (
          <ToolbarGroup
            editor={editor}
            groupId="attachmentTools"
            tools={
              editor.isEditable
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
