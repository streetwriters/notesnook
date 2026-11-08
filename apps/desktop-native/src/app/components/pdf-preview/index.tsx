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

import { useMemo } from "react";
import { Button, Flex, Text, WebView } from "@ui";
import { Close } from "../icons";

export type PdfPreviewProps = {
  fileUrl: string | Uint8Array;
  onClose?: () => void;
  hash?: string;
};

function toBase64(bytes: Uint8Array) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk)
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  return btoa(binary);
}

export function PdfPreview(props: PdfPreviewProps) {
  const { fileUrl, onClose } = props;
  const uri = useMemo(
    () =>
      typeof fileUrl === "string"
        ? fileUrl
        : `data:application/pdf;base64,${toBase64(fileUrl)}`,
    [fileUrl]
  );

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
      <WebView testID="pdf-webview" source={{ uri }} sx={{ flex: 1 }} />
      {!uri ? <Text>No file</Text> : null}
    </Flex>
  );
}
