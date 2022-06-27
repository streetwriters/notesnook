import { Input } from "@rebass/forms";
import { useState } from "react";
import { Flex, Text } from "rebass";
import { ImageAttributes } from "../../extensions/image";
import { Button } from "../../components/button";
import { Popup } from "../components/popup";

export type ImageUploadPopupProps = {
  onInsert: (image: ImageAttributes) => void;
  onClose: () => void;
};
export function ImageUploadPopup(props: ImageUploadPopupProps) {
  const { onInsert, onClose } = props;
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string>();
  const [url, setUrl] = useState<string>("");

  return (
    <Popup
      title="Insert image from URL"
      onClose={onClose}
      action={{
        loading: isDownloading,
        title: "Insert image",
        onClick: async () => {
          setIsDownloading(true);
          setError(undefined);

          try {
            const response = await fetch(url);
            if (!response.ok)
              return setError(`invalid status code ${response.status}`);

            const contentType = response.headers.get("Content-Type");
            const contentLength = response.headers.get("Content-Length");

            if (
              !contentType ||
              !contentLength ||
              contentLength === "0" ||
              !contentType.startsWith("image/")
            )
              return setError("not an image");

            const size = parseInt(contentLength);
            const dataurl = await toDataURL(await response.blob());
            onInsert({ src: dataurl, type: contentType, size });
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          } finally {
            setIsDownloading(false);
          }
        },
      }}
    >
      <Flex sx={{ px: 2, flexDirection: "column", width: ["auto", 350] }}>
        <Input
          type="url"
          autoFocus
          placeholder="Paste Image URL here"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(undefined);
          }}
        />

        {error ? (
          <Text
            variant={"error"}
            sx={{
              bg: "errorBg",
              mt: 1,
              p: 1,
              borderRadius: "default",
            }}
          >
            Failed to download image: {error.toLowerCase()}.
          </Text>
        ) : (
          <Text
            variant={"subBody"}
            sx={{
              bg: "shade",
              color: "primary",
              mt: 1,
              p: 1,
              borderRadius: "default",
            }}
          >
            To protect your privacy, we will download the image &amp; add it to
            your attachments.
          </Text>
        )}
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

// async function validateURL(url: string): Promise<boolean> {
//   try {
//     const response = await fetch(url, { method: "HEAD" });

//     return (
//       response.ok &&
//       !!response.headers.get("Content-Type")?.startsWith("image/") &&
//       response.headers.get("Content-Length") !== "0"
//     );
//   } catch {
//     return false;
//   }
// }
