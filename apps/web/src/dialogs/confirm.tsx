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

import { Box, Checkbox, Label, Text } from "@theme-ui/components";
import { useRef } from "react";
import { Perform } from "../common/dialog-controller";
import { mdToHtml } from "../utils/md";
import Dialog from "../components/dialog";

type Check = { text: string; default?: boolean };
export type ConfirmDialogProps<TCheckId extends string> = {
  title: string;
  subtitle?: string;
  onClose: Perform<false | Record<TCheckId, boolean>>;
  width?: number;
  positiveButtonText?: string;
  negativeButtonText?: string;
  message?: string;
  checks?: Partial<Record<TCheckId, Check>>;
};

function ConfirmDialog<TCheckId extends string>(
  props: ConfirmDialogProps<TCheckId>
) {
  const {
    onClose,
    title,
    subtitle,
    width,
    negativeButtonText,
    positiveButtonText,
    message,
    checks
  } = props;
  const checkedItems = useRef<Record<TCheckId, boolean>>({} as any);

  return (
    <Dialog
      testId="confirm-dialog"
      isOpen={true}
      title={title}
      width={width}
      description={subtitle}
      onClose={() => onClose(false)}
      positiveButton={
        positiveButtonText
          ? {
              text: positiveButtonText,
              onClick: () => onClose(checkedItems.current),
              autoFocus: !!positiveButtonText
            }
          : undefined
      }
      negativeButton={
        negativeButtonText
          ? {
              text: negativeButtonText,
              onClick: () => onClose(false)
            }
          : undefined
      }
    >
      <Box
        sx={{
          pb: !negativeButtonText && !positiveButtonText ? 2 : 0,
          p: { m: 0 }
        }}
      >
        {message ? (
          <Text
            as="span"
            variant="body"
            dangerouslySetInnerHTML={{ __html: mdToHtml(message) }}
          />
        ) : null}
        {checks
          ? Object.entries<Check | undefined>(checks).map(
              ([id, check]) =>
                check && (
                  <Label
                    key={id}
                    id={id}
                    variant="text.body"
                    sx={{ alignItems: "center" }}
                  >
                    <Checkbox
                      name={id}
                      defaultChecked={check.default}
                      sx={{ mr: "small", width: 18, height: 18 }}
                      onChange={(e) =>
                        (checkedItems.current[id as TCheckId] =
                          e.currentTarget.checked)
                      }
                    />
                    {check.text}{" "}
                  </Label>
                )
            )
          : null}
      </Box>
    </Dialog>
  );
}

export default ConfirmDialog;
