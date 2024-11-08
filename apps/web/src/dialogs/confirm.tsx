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

import { Checkbox, Flex, Label, Text } from "@theme-ui/components";
import { useRef } from "react";
import { mdToHtml } from "../utils/md";
import Dialog from "../components/dialog";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import { getChangelog } from "../utils/version";
import { downloadUpdate } from "../utils/updater";
import { ErrorText } from "../components/error-text";
import { strings } from "@notesnook/intl";

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
  warnings?: string[];
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
    warnings,
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
      onOpen={() => {
        for (const checkId in checks) {
          checkedItems.current[checkId as TCheckId] =
            checks[checkId as TCheckId]?.default || false;
        }
      }}
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
      <Flex
        sx={{
          flexDirection: "column",
          gap: 1,
          pb: !negativeButtonText && !positiveButtonText ? 2 : 0,
          p: { m: 0 }
        }}
      >
        {message ? (
          <Text
            as="div"
            variant="body"
            dangerouslySetInnerHTML={{ __html: mdToHtml(message) }}
          />
        ) : null}
        {warnings?.map((text) => (
          <ErrorText key={text} error={text} sx={{ mt: 0 }} />
        ))}
        {checks
          ? Object.entries<Check | undefined>(checks).map(
              ([id, check]) =>
                check && (
                  <Label
                    key={id}
                    id={id}
                    variant="text.body"
                    sx={{ fontWeight: "bold" }}
                  >
                    <Checkbox
                      name={id}
                      defaultChecked={check.default}
                      sx={{
                        mr: "small",
                        width: 18,
                        height: 18,
                        color: "accent"
                      }}
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
      </Flex>
    </Dialog>
  );
});

export function showMultiDeleteConfirmation(length: number) {
  return ConfirmDialog.show({
    title: strings.doActions.delete.item(length),
    message: strings.moveToTrashDesc(
      db.settings.getTrashCleanupInterval() || 7
    ),
    positiveButtonText: strings.yes(),
    negativeButtonText: strings.no()
  });
}

export function showMultiPermanentDeleteConfirmation(length: number) {
  return ConfirmDialog.show({
    title: strings.doActions.permanentlyDelete.item(length),
    message: strings.irreverisibleAction(),
    positiveButtonText: strings.yes(),
    negativeButtonText: strings.no()
  });
}

export async function showLogoutConfirmation() {
  return await ConfirmDialog.show({
    title: strings.logout(),
    message: strings.logoutConfirmation(),
    positiveButtonText: strings.yes(),
    negativeButtonText: strings.no(),
    warnings: (await db.hasUnsyncedChanges())
      ? [strings.unsyncedChangesWarning()]
      : [],
    checks: {
      backup: {
        text: strings.backupDataBeforeLogout(),
        default: true
      }
    }
  });
}

export function showClearSessionsConfirmation() {
  return ConfirmDialog.show({
    title: strings.logoutAllOtherDevices(),
    message: strings.logoutAllOtherDevicesDescription(),
    positiveButtonText: strings.yes(),
    negativeButtonText: strings.no()
  });
}

export async function showUpdateAvailableNotice({
  version
}: {
  version: string;
}) {
  const changelog = await getChangelog(version);

  return showUpdateDialog({
    title: strings.newVersion(),
    subtitle: strings.newVersionAvailable(version),
    changelog,
    action: { text: strings.updateNow(), onClick: () => downloadUpdate() }
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
