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

import { Box } from "@notesnook/ui";
import { strings } from "@notesnook/intl";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";

type ExportErrorsDialogProps = BaseDialogProps<boolean> & {
  count: number;
  errors: Error[];
};

export const ExportErrorsDialog = DialogManager.register(
  function ExportErrorsDialog({
    count,
    errors,
    onClose
  }: ExportErrorsDialogProps) {
    return (
      <Dialog
        title={`Exported ${count} notes`}
        description={`Export complete with ${errors.length} errors.`}
        isOpen={true}
        width={500}
        noScroll
        onClose={() => onClose(false)}
        positiveButton={{
          text: strings.okay(),
          onClick: () => onClose(true),
          autoFocus: true
        }}
      >
        <Box
          as="ol"
          sx={{
            mt: "spacing4",
            mb: "spacing7",
            fontFamily: "body",
            color: "paragraph",
            fontSize: "md",
            lineHeight: 1.4
          }}
        >
          {errors.map((error, index) => (
            <li key={`${index}-${error.message}`}>{error.message}</li>
          ))}
        </Box>
      </Dialog>
    );
  }
);
