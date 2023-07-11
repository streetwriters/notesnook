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

import { Box, Flex, Embed } from "@theme-ui/components";
import { useRef, useState } from "react";
import { EmbedAlignmentOptions, EmbedAttributes } from "./embed";
import { SelectionBasedReactNodeViewProps } from "../react";
import { DesktopOnly } from "../../components/responsive";
import { ToolbarGroup } from "../../toolbar/components/toolbar-group";
import { Icons } from "../../toolbar";
import { Icon } from "@notesnook/ui";
import { Resizer } from "../../components/resizer";
import { EmotionThemeVariant } from "@notesnook/theme";

export function EmbedComponent(
  props: SelectionBasedReactNodeViewProps<
    EmbedAttributes & EmbedAlignmentOptions
  >
) {
  const { editor, updateAttributes, selected, node } = props;
  const [isLoading, setIsLoading] = useState(true);
  const embedRef = useRef<HTMLIFrameElement>(null);
  const { src, width, height, textDirection } = node.attrs;

  let align = node.attrs.align;
  if (!align) align = textDirection ? "right" : "left";

  return (
    <Flex
      sx={{
        justifyContent:
          align === "center" ? "center" : align === "left" ? "start" : "end",
        position: "relative"
      }}
    >
      <Resizer
        handleColor="accent"
        editor={editor}
        selected={selected}
        width={width}
        onResize={(width, height) => {
          updateAttributes(
            {
              width,
              height
            },
            { addToHistory: true, preventUpdate: false }
          );
        }}
      >
        <EmotionThemeVariant variant="secondary">
          <Box
            sx={{
              width: "100%",
              display: editor.isEditable ? "flex" : "none",
              position: "absolute",
              top: -24,
              justifyContent: "end",
              p: "small",
              bg: editor.isEditable ? "background" : "transparent",
              borderTopLeftRadius: "default",
              borderTopRightRadius: "default",
              borderColor: selected ? "border" : "background",
              cursor: "pointer",
              ":hover": {
                borderColor: "border"
              }
            }}
          >
            <Icon path={Icons.dragHandle} size={"big"} />
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
                        "embedAlignLeft",
                        "embedAlignCenter",
                        "embedAlignRight",
                        "embedProperties"
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
          </Box>
        </EmotionThemeVariant>
        <Embed
          ref={embedRef}
          src={src}
          width={"100%"}
          height={"100%"}
          sx={{
            bg: "background",
            border: selected
              ? "2px solid var(--accent)"
              : "2px solid transparent",
            borderRadius: "default"
          }}
          onLoad={() => setIsLoading(false)}
          {...props}
        />
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
            <Icon path={Icons.loading} rotate size={32} color="icon" />
          </Flex>
        )}
      </Resizer>
    </Flex>
  );
}
