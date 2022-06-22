import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex } from "rebass";
import { ImageAttributes } from "../../extensions/image";
import { Button } from "../../components/button";
import { Popup } from "../components/popup";

export type ImageUploadPopupProps = {
  onInsert: (image: ImageAttributes) => void;
  onClose: () => void;
};
export function ImageUploadPopup(props: ImageUploadPopupProps) {
  const { onInsert, onClose } = props;
  const [url, setUrl] = useState<string>("");

  return (
    <Popup title="Upload image from URL" onClose={onClose}>
      <Flex sx={{ p: 1, flexDirection: "column", width: ["auto", 250] }}>
        <Input
          type="url"
          sx={{
            height: "45px",
          }}
          autoFocus
          placeholder="Paste Image URL here"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <Button
          variant={"primary"}
          sx={{
            alignSelf: ["stretch", "end", "end"],
            my: 1,
            mr: [0, 1],
          }}
          onClick={async () => {
            const response = await fetch(url);
            if (!response.ok) return; // TODO show error

            const contentType = response.headers.get("Content-Type");
            const contentLength = response.headers.get("Content-Length");

            if (
              !contentType ||
              !contentLength ||
              contentLength === "0" ||
              !contentType.startsWith("image/")
            )
              return;

            const size = parseInt(contentLength);
            const dataurl = await toDataURL(await response.blob());
            onInsert({ src: dataurl, type: contentType, size });
          }}
          disabled={!url.trim()}
        >
          Insert image
        </Button>
      </Flex>
    </Popup>
  );
}

function toDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (_e) => resolve(reader.result as string);
    reader.onerror = (_e) => reject(reader.error);
    reader.onabort = (_e) => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
}
