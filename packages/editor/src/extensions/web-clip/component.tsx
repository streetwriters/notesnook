/*
This file is part of the Notesnook project (https://notesnook.com/)

Copyright (C) 2022 Streetwriters (Private) Limited

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
import { SelectionBasedReactNodeViewProps } from "../react";
import { Icon, Icons } from "../../toolbar";
import { WebClipAttributes, WebClipOptions } from "./web-clip";
import { DesktopOnly } from "../../components/responsive";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";

const FAILED_CONTENT = `<html><head>
<title>Failed to load web clip</title>
</head>
<body>
<p>Failed to load web clip</p>
</body>
</html>`;

export function WebClipComponent(
  props: SelectionBasedReactNodeViewProps<WebClipAttributes>
) {
  const { editor, selected, node, updateAttributes } = props;
  const [isLoading, setIsLoading] = useState(true);
  const embedRef = useRef<HTMLIFrameElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>();
  const { src, title, hash, fullscreen } = node.attrs;
  const { onLoadWebClip } = editor.storage.webclip as WebClipOptions;

  useEffect(() => {
    (async function () {
      const iframe = embedRef.current;
      if (!iframe || !iframe.contentDocument) return;
      iframe.contentDocument.open();
      iframe.contentDocument.write(
        (await onLoadWebClip(editor, hash)) || FAILED_CONTENT
      );
      iframe.contentDocument.close();
      iframe.contentDocument.head.innerHTML += `<base target="_blank">`;

      setIsLoading(false);
    })();
  }, [hash, onLoadWebClip]);

  useEffect(() => {
    function fullscreenchanged() {
      if (document.fullscreenElement) {
        resizeObserverRef.current?.disconnect();
        resetIframeSize(embedRef.current);
      } else {
        updateAttributes({ fullscreen: false });
        resizeIframe(embedRef.current);

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

  return (
    <>
      <Box
        sx={{
          mt: 2,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          border: selected
            ? "2px solid var(--primary)"
            : "2px solid var(--border)",
          borderRadius: "default"
        }}
      >
        <Flex
          sx={{
            width: "100%",
            p: 1,
            bg: "bgSecondary",
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
                color: "icon",
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
              width="100%"
              frameBorder={"0"}
              scrolling={fullscreen ? "yes" : "no"}
              style={{ transformOrigin: "0 0", overflow: "hidden" }}
              onLoad={() => {
                if (fullscreen) return;

                resizeIframe(embedRef.current);

                if (embedRef.current?.contentDocument) {
                  resizeObserverRef.current = new ResizeObserver(() => {
                    resizeIframe(embedRef.current);
                  });
                  resizeObserverRef.current.observe(
                    embedRef.current?.contentDocument?.body
                  );
                }
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
              justifyContent: "center"
            }}
          >
            <Icon path={Icons.loading} rotate size={32} color="disabled" />
          </Flex>
        )}
      </Box>
    </>
  );
}

function resizeIframe(iframe?: HTMLIFrameElement | null) {
  if (!iframe || !iframe.contentDocument || !iframe.contentDocument.body)
    return;

  const height = iframe.contentDocument.body.scrollHeight;
  const width = iframe.contentDocument.body.scrollWidth;

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
