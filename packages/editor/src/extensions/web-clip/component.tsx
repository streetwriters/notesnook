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

import { Box, Flex, Text } from "@theme-ui/components";
import { useEffect, useState } from "react";
import { ReactNodeViewProps } from "../react/index.js";
import { Icons } from "../../toolbar/index.js";
import { Icon } from "@notesnook/ui";
import { WebClipAttributes } from "./web-clip.js";
import { DesktopOnly } from "../../components/responsive/index.js";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group.js";

const FAILED_CONTENT = `<html><head>
<title>Failed to load web clip</title>
</head>
<body>
<p>Failed to load web clip</p>
</body>
</html>`;

export function WebClipComponent(props: ReactNodeViewProps<WebClipAttributes>) {
  const { editor, selected, node, updateAttributes } = props;
  const { src, title, progress } = node.attrs;
  const [source, setSource] = useState<string>();

  useEffect(() => {
    (async function () {
      const html = await editor.storage
        .getAttachmentData?.(node.attrs)
        .catch(() => null);
      const doc = new DOMParser().parseFromString(
        html || FAILED_CONTENT,
        "text/html"
      );
      doc.head.innerHTML += `<base target="_blank">`;
      const blob = new Blob([doc.documentElement.outerHTML], {
        type: "text/html"
      });
      const blobUrl = URL.createObjectURL(blob);
      setSource(blobUrl);
      return () => {
        URL.revokeObjectURL(blobUrl);
      };
    })();
  }, []);

  useEffect(() => {
    function fullscreenchanged() {
      if (!document.fullscreenElement) {
        updateAttributes({ fullscreen: false });
      }
    }

    document.addEventListener("fullscreenchange", fullscreenchanged);
    return () => {
      document.removeEventListener("fullscreenchange", fullscreenchanged);
    };
  }, [updateAttributes]);

  return (
    <>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          border: selected
            ? "2px solid var(--accent)"
            : "2px solid var(--border)",
          borderRadius: "default"
        }}
      >
        <Flex
          sx={{
            width: "100%",
            p: 1,
            bg: "var(--background-secondary)",
            borderTopLeftRadius: "default",
            borderTopRightRadius: "default",
            cursor: "pointer",
            justifyContent: "space-between"
          }}
          title={title}
        >
          <Flex sx={{ alignItems: "center" }}>
            <Icon
              path={Icons.webClip}
              size={14}
              onClick={() => {
                window.open(src, "_blank", "noreferrer");
              }}
            />
            <Text
              variant="subBody"
              sx={{
                ml: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {title}
            </Text>
          </Flex>

          <DesktopOnly>
            {selected && (
              <Flex sx={{ position: "relative", justifyContent: "end" }}>
                <Flex
                  sx={{
                    position: "absolute",
                    top: -10,
                    mb: 2,
                    alignItems: "end"
                  }}
                >
                  <ToolbarGroup
                    editor={editor}
                    groupId="webclipTools"
                    tools={[
                      "webclipFullScreen",
                      "webclipOpenExternal",
                      "webclipOpenSource"
                    ]}
                    sx={{
                      boxShadow: "menu",
                      borderRadius: "default",
                      bg: "background"
                    }}
                  />
                </Flex>
              </Flex>
            )}
          </DesktopOnly>
        </Flex>
        <Box
          sx={{
            overflow: "hidden auto",
            maxHeight: 1080
          }}
        >
          <Box sx={{ overflow: "hidden" }}>
            <iframe
              frameBorder={"0"}
              style={{
                width: "100%",
                height: "100vh",
                background: "var(--background)"
              }}
              src={source}
              sandbox="allow-popups allow-popups-to-escape-sandbox"
            />
          </Box>
        </Box>
        {!source && (
          <Flex
            sx={{
              position: "absolute",
              bottom: 0,
              width: "100%",
              height: "calc(100% - 20px)",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column"
            }}
          >
            <Icon path={Icons.loading} rotate size={32} />
            {progress ? (
              <Text sx={{ mt: 2 }}>Loading web clip ({progress}%)</Text>
            ) : null}
          </Flex>
        )}
      </Box>
    </>
  );
}
