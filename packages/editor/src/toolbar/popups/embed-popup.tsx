import { Button, Flex, Text } from "rebass";
import { useCallback, useEffect, useState } from "react";
import { Popup } from "../components/popup";
import { Toggle } from "../../components/toggle";
import { Input, Textarea } from "@rebass/forms";
import {
  EmbedAlignmentOptions,
  EmbedAttributes,
  EmbedSizeOptions,
} from "../../extensions/embed";
import { IconNames } from "../icons";
import { ToolButton } from "../components/tool-button";
import { convertUrlToEmbedUrl } from "@social-embed/lib";

type Embed = Required<EmbedAttributes> & EmbedAlignmentOptions;
type EmbedSource = "url" | "code";
export type EmbedPopupProps = {
  onClose: (embed: Embed) => void;
  title?: string;
  icon?: IconNames;

  embed?: Embed;
  onSizeChanged?: (size: EmbedSizeOptions) => void;
  onSourceChanged?: (src: string) => void;
};

export function EmbedPopup(props: EmbedPopupProps) {
  const { onClose, onSizeChanged, onSourceChanged, title, icon, embed } = props;
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
            height: newWidth * (height / width),
          }
        : newHeight
        ? {
            width: newHeight * (width / height),
            height: newHeight,
          }
        : {
            width: 0,
            height: 0,
          };
      setWidth(size.width);
      setHeight(size.height);
      if (onSizeChanged) onSizeChanged(size);
    },
    [width, height]
  );

  useEffect(() => {
    onSourceChanged && onSourceChanged(src);
  }, [onSourceChanged, src]);

  return (
    <Popup
      title={title}
      action={{
        icon,
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
          if (!!convertedUrl) _src = convertedUrl;
          onClose({
            height: _height,
            width: _width,
            src: _src,
          });
        },
      }}
    >
      <Flex sx={{ width: 300, flexDirection: "column", p: 1 }}>
        {error && (
          <Text
            variant={"error"}
            sx={{
              bg: "errorBg",
              color: "error",
              p: 1,
              borderRadius: "default",
            }}
          >
            Error: {error}
          </Text>
        )}
        {/* <Flex sx={{ position: "relative", alignItems: "center" }}> */}
        <Flex>
          <Button
            variant={"dialog"}
            sx={{
              p: 1,
              mr: 1,
              color: embedSource === "url" ? "primary" : "text",
            }}
            onClick={() => setEmbedSource("url")}
          >
            From link
          </Button>
          <Button
            variant={"dialog"}
            sx={{
              p: 1,
              color: embedSource === "code" ? "primary" : "text",
            }}
            onClick={() => setEmbedSource("code")}
          >
            From code
          </Button>
        </Flex>
        {embedSource === "url" ? (
          <Input
            placeholder="Embed source URL"
            value={src}
            autoFocus
            onChange={(e) => setSrc(e.target.value)}
            sx={{ p: 1, mt: 1, fontSize: "body" }}
          />
        ) : (
          <Textarea
            autoFocus
            variant={"forms.input"}
            sx={{ fontSize: "subBody", fontFamily: "monospace", mt: 1 }}
            minHeight={100}
            onChange={(e) => setSrc(e.target.value)}
            placeholder="Paste embed code here. Only iframes are supported."
          />
        )}
        {embedSource === "url" ? (
          <Flex sx={{ alignItems: "center", mt: 2 }}>
            <Input
              type="number"
              placeholder="Width"
              value={width}
              sx={{
                mr: 2,
                p: 1,
                fontSize: "body",
              }}
              onChange={(e) => onSizeChange(e.target.valueAsNumber)}
            />
            <Input
              type="number"
              placeholder="Height"
              value={height}
              sx={{ p: 1, fontSize: "body" }}
              onChange={(e) => onSizeChange(undefined, e.target.valueAsNumber)}
            />
          </Flex>
        ) : null}
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
