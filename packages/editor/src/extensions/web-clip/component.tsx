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
import { useEffect, useRef, useState } from "react";
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
  const [isLoading, setIsLoading] = useState(true);
  const embedRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const { src, title, fullscreen, progress } = node.attrs;

  useEffect(() => {
    (async function () {
      if (!isLoading) return;

      const html = await editor.storage
        .getAttachmentData?.(node.attrs)
        .catch(() => null);

      const iframe = embedRef.current;
      if (!iframe || !iframe.contentDocument) return;
      iframe.contentDocument.open();
      iframe.contentDocument.write(
        typeof html !== "string" || !html ? FAILED_CONTENT : html
      );
      iframe.contentDocument.close();
      iframe.contentDocument.head.innerHTML += `<base target="_blank">`;
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    function fullscreenchanged() {
      if (document.fullscreenElement) {
        resizeObserverRef.current?.disconnect();
        resetIframeSize(embedRef.current);
      } else {
        updateAttributes({ fullscreen: false });
        resizeIframe(node.attrs, embedRef.current);

        if (embedRef.current?.contentDocument) {
          resizeObserverRef.current?.observe(
            embedRef.current?.contentDocument?.body
          );
        }
      }
    }

    document.addEventListener("fullscreenchange", fullscreenchanged);
    return () => {
      document.removeEventListener("fullscreenchange", fullscreenchanged);
    };
  }, [updateAttributes]);

  useEffect(() => {
    if (embedRef.current?.contentDocument) {
      resizeObserverRef.current = new ResizeObserver(() => {
        setTimeout(() => resizeIframe(node.attrs, embedRef.current), 100);
      });
      resizeObserverRef.current.observe(
        embedRef.current?.contentDocument?.body
      );
    }
    return () => {
      resizeObserverRef.current?.disconnect();
    };
  }, []);

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
              ref={embedRef}
              width="auto"
              frameBorder={"0"}
              scrolling={fullscreen ? "yes" : "no"}
              style={{ transformOrigin: "0 0", overflow: "hidden" }}
              onLoad={() => {
                if (fullscreen) return;

                resizeIframe(node.attrs, embedRef.current);
              }}
            />
          </Box>
        </Box>
        {isLoading && (
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

function resizeIframe(
  attributes: WebClipAttributes,
  iframe?: HTMLIFrameElement | null
) {
  if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body)
    return;

  const height = attributes.height
    ? parseInt(attributes.height)
    : iframe.contentDocument.body.scrollHeight;

  const width = attributes.width
    ? parseInt(attributes.width)
    : iframe.contentDocument.body.scrollWidth;

  iframe.style.height = `${height}px`;
  iframe.style.width = `${width}px`;

  const container = iframe.parentElement;
  if (!container || container.clientWidth > width) return;
  const scale = container.clientWidth / width;
  iframe.style.scale = `${scale}`;
  container.style.height = `${height * scale}px`;
}

function resetIframeSize(iframe?: HTMLIFrameElement | null) {
  if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body)
    return;

  const height = iframe.contentDocument.body.scrollHeight;
  const width = iframe.contentDocument.body.scrollWidth;

  iframe.style.height = `${height}px`;
  iframe.style.width = `${width}px`;
  iframe.style.scale = `1`;
}
