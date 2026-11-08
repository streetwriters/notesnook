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

import { Dialog, Flex, Text } from "@ui";
import { strings } from "@notesnook/intl";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";

type PdfPreviewDialogProps = BaseDialogProps<boolean> & {
  url: string;
  hash: string;
};

export const PdfPreviewDialog = DialogManager.register(
  function PdfPreviewDialog({ onClose }: PdfPreviewDialogProps) {
    return (
      <Dialog
        isOpen={true}
        width="100%"
        height="100%"
        noScroll
        sx={{ py: 1 }}
        onClose={() => onClose(false)}
        negativeButton={{
          text: strings.close(),
          onClick: () => onClose(false)
        }}
      >
        <Flex sx={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text variant="body">
            PDF preview is not available on desktop yet
          </Text>
        </Flex>
      </Dialog>
    );
  }
);
