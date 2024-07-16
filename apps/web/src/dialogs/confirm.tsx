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
import { mdToHtml } from "../utils/md";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import { AppVersion, getChangelog } from "../utils/version";
import { downloadUpdate } from "../utils/updater";

type Check = { text: string; default?: boolean };
export type ConfirmDialogProps<TCheckId extends string> = BaseDialogProps<
  false | Record<TCheckId, boolean>
> & {
  title: string;
  subtitle?: string;
  width?: number;
  positiveButtonText?: string;
  negativeButtonText?: string;
  message?: string;
  checks?: Partial<Record<TCheckId, Check>>;
};

export const ConfirmDialog = DialogManager.register(function ConfirmDialog<
  TCheckId extends string
>(props: ConfirmDialogProps<TCheckId>) {
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
                    {check.text}
                  </Label>
                )
            )
          : null}
      </Box>
    </Dialog>
  );
});

export function showMultiDeleteConfirmation(length: number) {
  return ConfirmDialog.show({
    title: `Delete ${length} items?`,
    message: `These items will be **kept in your Trash for ${
      db.settings.getTrashCleanupInterval() || 7
    } days** after which they will be permanently deleted.`,
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showMultiPermanentDeleteConfirmation(length: number) {
  return ConfirmDialog.show({
    title: `Permanently delete ${length} items?`,
    message:
      "These items will be **permanently deleted**. This is IRREVERSIBLE.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showLogoutConfirmation() {
  return ConfirmDialog.show({
    title: `Logout?`,
    message:
      "Logging out will clear all data stored on THIS DEVICE. Make sure you have synced all your changes before logging out.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showClearSessionsConfirmation() {
  return ConfirmDialog.show({
    title: `Logout from other devices?`,
    message:
      "All other logged-in devices will be forced to logout stopping sync. Use with care lest you lose important notes.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export async function showUpdateAvailableNotice({
  version
}: {
  version: string;
}) {
  const changelog = await getChangelog(version);

  return showUpdateDialog({
    title: `New version available`,
    subtitle: `v${version} is available for download`,
    changelog,
    action: { text: `Update now`, onClick: () => downloadUpdate() }
  });
}

type UpdateDialogProps = {
  title: string;
  subtitle: string;
  changelog: string;
  action: {
    text: string;
    onClick: () => void;
  };
};
async function showUpdateDialog({
  title,
  subtitle,
  changelog,
  action
}: UpdateDialogProps) {
  const result = await ConfirmDialog.show({
    title,
    subtitle,
    message: changelog,
    width: 500,
    positiveButtonText: action.text
  });
  if (result && action.onClick) action.onClick();
}
