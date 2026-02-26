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
import { AudioAttachment } from "../attachment/types.js";
import { useRef, useState, useEffect } from "react";
import { Icon } from "@notesnook/ui";
import { Icons } from "../../toolbar/icons.js";
import { ReactNodeViewProps } from "../react/index.js";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group.js";
import { DesktopOnly } from "../../components/responsive/index.js";
import { toBlobURL, revokeBloburl } from "../../utils/downloader.js";
import { formatBytes } from "@notesnook/common";

const SAMPLE_AUDIO = toBlobURL(
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=",
  "other",
  "audio/wav",
  "sample-audio"
);

export function AudioComponent(props: ReactNodeViewProps<AudioAttachment>) {
  const { editor, node, selected } = props;
  const { filename, size, progress, mime, hash } = node.attrs;
  const elementRef = useRef<HTMLDivElement>();
  const [isDragging, setIsDragging] = useState(false);
  const isLoading = useRef(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    return () => {
      if (hash) {
        revokeBloburl(hash);
      }
    };
  }, [hash]);

  return (
    <Box
      ref={elementRef}
      contentEditable={false}
      draggable="false"
      sx={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        userSelect: "none",
        backgroundColor: "var(--background-secondary)",
        p: 1,
        borderRadius: "default",
        border: "1px solid var(--border)",
        borderColor: selected ? "accent" : "border",
        width: "100%",
        maxWidth: 500,
        ":hover": {
          backgroundColor: "var(--hover)"
        }
      }}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      data-drag-handle
      data-drag-image
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          mb: 2
        }}
      >
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
          {progress ? `${progress}%` : formatBytes(size, 1)}
        </Text>
      </Box>
      {error ? (
        <Text variant="error">{error}</Text>
      ) : (
        <Box
          sx={{
            width: "100%",
            "& audio": {
              width: "100%",
              height: 35
            }
          }}
        >
          <audio
            onMouseDown={(e) => e.stopPropagation()}
            onDragStart={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            controls
            controlsList="nodownload nofullscreen"
            src={SAMPLE_AUDIO}
            onPause={(e) => {
              if (isLoading.current) {
                e.preventDefault();
              }
            }}
            onPlay={(e) => {
              const target = e.currentTarget;
              if (
                editor.storage?.getAttachmentData &&
                hash &&
                target.src === SAMPLE_AUDIO &&
                !isLoading.current
              ) {
                e.preventDefault();
                isLoading.current = true;
                editor.storage
                  .getAttachmentData({
                    type: "file",
                    hash
                  })
                  .then((data: string | undefined) => {
                    isLoading.current = false;
                    if (!data) return;
                    const url = toBlobURL(data, "other", mime, hash);
                    if (!url) return;
                    target.src = url;
                    return target.play();
                  })
                  .catch((e) => {
                    isLoading.current = false;
                    setError((e as Error).message);
                  });
              }
            }}
          >
            <Text as="p">Your browser does not support the audio element.</Text>
          </audio>
        </Box>
      )}
      <DesktopOnly>
        {selected && !isDragging && (
          <ToolbarGroup
            editor={editor}
            groupId="audioTools"
            tools={
              editor.isEditable
                ? ["removeAttachment", "downloadAttachment"]
                : ["downloadAttachment"]
            }
            sx={{
              boxShadow: "menu",
              borderRadius: "default",
              backgroundColor: "var(--background)",
              position: "absolute",
              top: -35,
              right: 0
            }}
          />
        )}
      </DesktopOnly>
    </Box>
  );
}
