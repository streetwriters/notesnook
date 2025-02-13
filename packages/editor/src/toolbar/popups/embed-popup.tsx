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

import { Flex, Text } from "@theme-ui/components";
import { useCallback, useState } from "react";
import { Popup } from "../components/popup.js";
import { Input, Textarea } from "@theme-ui/components";
import { Embed, EmbedSizeOptions } from "../../extensions/embed/index.js";
import { convertUrlToEmbedUrl } from "@social-embed/lib";
import { InlineInput } from "../../components/inline-input/index.js";
import { Tabs, Tab } from "../../components/tabs/index.js";
import { strings } from "@notesnook/intl";

type EmbedSource = "url" | "code";
export type EmbedPopupProps = {
  onClose: (embed?: Embed) => void;
  title: string;

  embed?: Embed;
  onSizeChanged?: (size: EmbedSizeOptions) => void;
};

export function EmbedPopup(props: EmbedPopupProps) {
  const { onClose, onSizeChanged, title, embed } = props;
  const [width, setWidth] = useState(embed?.width || 300);
  const [height, setHeight] = useState(embed?.height || 150);
  const [src, setSrc] = useState(embed?.src || "");
  const [embedSource, setEmbedSource] = useState<EmbedSource>("url");
  const [error, setError] = useState<string | null>(null);

  const onSizeChange = useCallback(
    (newWidth?: number, newHeight?: number) => {
      const size: EmbedSizeOptions = newWidth
        ? {
            width: newWidth,
            height: newWidth * (height / width)
          }
        : newHeight
        ? {
            width: newHeight * (width / height),
            height: newHeight
          }
        : {
            width: 0,
            height: 0
          };
      setWidth(size.width);
      setHeight(size.height);
      if (onSizeChanged) onSizeChanged(size);
    },
    [height, width, onSizeChanged]
  );

  return (
    <Popup
      title={title}
      onClose={() => onClose()}
      action={{
        title: strings.save(),
        onClick: () => {
          setError(null);
          let _src = src;
          let _width = width;
          let _height = height;
          if (embedSource === "code") {
            const document = new DOMParser().parseFromString(src, "text/html");
            if (document.getElementsByTagName("iframe").length <= 0)
              return setError("Embed code must include an iframe.");

            const srcValue = getAttribute(document, "src");
            if (!srcValue)
              return setError(
                "Embed code must include an iframe with an src attribute."
              );

            _src = srcValue;

            const widthValue = getAttribute(document, "width");
            if (widthValue && !isNaN(parseInt(widthValue)))
              _width = parseInt(widthValue);

            const heightValue = getAttribute(document, "height");
            if (heightValue && !isNaN(parseInt(heightValue)))
              _height = parseInt(heightValue);
          }
          const convertedUrl = convertUrlToEmbedUrl(_src);
          if (convertedUrl) _src = convertedUrl;
          if (_src.startsWith("javascript:")) {
            return setError("Embedding javascript code is not supported.");
          }
          onClose({
            height: _height,
            width: _width,
            src: _src
          });
        }
      }}
    >
      <Flex sx={{ flexDirection: "column", width: ["auto", 300] }}>
        {error && (
          <Text
            variant={"error"}
            sx={{
              bg: "var(--background-error)",
              p: 1,
              borderRadius: "default"
            }}
          >
            Error: {error}
          </Text>
        )}

        <Tabs
          activeIndex={0}
          containerProps={{ sx: { mx: 1, flexDirection: "column" } }}
          onTabChanged={(index) => setEmbedSource(index === 0 ? "url" : "code")}
        >
          <Tab title={strings.fromURL()}>
            <Input
              placeholder={strings.enterEmbedSourceURL()}
              value={src}
              autoFocus
              onChange={(e) => setSrc(e.target.value)}
              autoCapitalize="none"
              sx={{ fontSize: "body" }}
            />
            <Flex sx={{ alignItems: "center", mt: 1 }}>
              <InlineInput
                containerProps={{ sx: { mr: 1 } }}
                label="width"
                type="number"
                placeholder={strings.width()}
                value={width}
                sx={{
                  mr: 1,
                  fontSize: "body"
                }}
                onChange={(e) => onSizeChange(e.target.valueAsNumber)}
              />
              <InlineInput
                label="height"
                type="number"
                placeholder={strings.height()}
                value={height}
                sx={{ fontSize: "body" }}
                onChange={(e) =>
                  onSizeChange(undefined, e.target.valueAsNumber)
                }
              />
            </Flex>
          </Tab>
          <Tab title={strings.fromCode()}>
            <Textarea
              autoFocus
              variant={"forms.input"}
              sx={{
                fontSize: "subBody",
                fontFamily: "monospace",
                minHeight: [200, 100]
              }}
              onChange={(e) => setSrc(e.target.value)}
              placeholder={strings.pasteEmbedCode()}
            />
          </Tab>
        </Tabs>
      </Flex>
    </Popup>
  );
}

function getAttribute(document: Document, id: string) {
  const element = document.querySelector(`[${id}]`);
  if (!element) return null;
  const attribute = element.getAttribute(id);
  return attribute;
}
