import { Input } from "@streetwriters/rebass-forms";
import { useState } from "react";
import { Flex, Text } from "@streetwriters/rebass";
import { ImageAttributes } from "../../extensions/image";
import { Popup } from "../components/popup";
import { downloadImage, toDataURL } from "../../utils/downloader";

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
        disabled: !url,
        onClick: async () => {
          setIsDownloading(true);
          setError(undefined);

          try {
            const { blob, size, type } = await downloadImage(url);
            onInsert({ src: await toDataURL(blob), size, type });
          } catch (e) {
            if (e instanceof Error) setError(e.message);
          } finally {
            setIsDownloading(false);
          }
        }
      }}
    >
      <Flex sx={{ px: 1, flexDirection: "column", width: ["auto", 350] }}>
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
              borderRadius: "default"
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
              borderRadius: "default"
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
