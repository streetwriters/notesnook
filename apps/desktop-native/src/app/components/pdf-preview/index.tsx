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

import { strings } from "@notesnook/intl";
import { files, shell } from "@platform";
import { Button, Flex, Text } from "@ui";
import { Close, Download } from "../icons";
import { saveAttachment } from "../../common/attachments";
import { showToast } from "../../utils/toast";

export type PdfPreviewProps = {
  fileUrl: string | Uint8Array;
  onClose?: () => void;
  hash?: string;
};

async function saveBytes(bytes: Uint8Array) {
  const file = await files.create("document.pdf");
  await file.write(bytes);
  await file.close();
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function PdfPreview(props: PdfPreviewProps) {
  const { fileUrl, onClose, hash } = props;

  async function download() {
    try {
      if (hash) return await saveAttachment(hash);
      if (typeof fileUrl !== "string") return await saveBytes(fileUrl);
      const prefix = "base64,";
      const index = fileUrl.indexOf(prefix);
      if (fileUrl.startsWith("data:") && index > -1)
        return await saveBytes(
          base64ToBytes(fileUrl.slice(index + prefix.length))
        );
      shell.openUrl(fileUrl);
    } catch (e) {
      showToast("error", (e as Error).message);
    }
  }

  return (
    <Flex testID="pdf-preview" sx={{ flex: 1, flexDirection: "column" }}>
      {onClose ? (
        <Flex
          sx={{
            flexDirection: "row",
            p: 1,
            pt: 0,
            justifyContent: "flex-end"
          }}
        >
          <Button variant="tertiary" onPress={onClose} sx={{ p: 0 }}>
            <Close size={18} color="icon" />
          </Button>
        </Flex>
      ) : null}
      <Flex
        sx={{
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "spacing6"
        }}
      >
        <Text variant="body" sx={{ color: "paragraph-secondary" }}>
          PDF preview isn&apos;t available yet
        </Text>
        <Button
          testID="pdf-download"
          variant="secondary"
          onPress={download}
          sx={{ flexDirection: "row", gap: "spacing3", alignItems: "center" }}
        >
          <Download size={15} color="icon" />
          <Text>{strings.network.download()}</Text>
        </Button>
      </Flex>
    </Flex>
  );
}
