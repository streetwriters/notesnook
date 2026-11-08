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

import { useRef } from "react";
import { Box, Checkbox, Flex, Text } from "@ui";
import { Dialog } from "@ui";
import { BaseDialogProps, DialogManager } from "../common/dialog-manager";
import { db } from "../common/db";
import { getChangelog } from "../utils/version";
import { downloadUpdate } from "../utils/updater";
import { strings } from "@notesnook/intl";
import { ErrorText } from "./components/error-text";
import { Field } from "./components/field";
import { MarkdownText } from "./components/markdown-text";

type Check = { text: string; default?: boolean };
type Input = {
  title: string;
  defaultValue?: string;
  multiline?: boolean;
  helpText?: string;
  required?: boolean;
};
export type ConfirmDialogProps = BaseDialogProps<
  | false
  | {
      checks?: Record<string, boolean>;
      inputs?: Record<string, string>;
    }
> & {
  title: string;
  subtitle?: string;
  width?: number;
  positiveButtonText?: string;
  positiveButtonVariant?: string;
  negativeButtonText?: string;
  message?: string;
  warnings?: string[];
  checks?: Record<string, Check>;
  inputs?: Record<string, Input>;
};

export const ConfirmDialog = DialogManager.register(function ConfirmDialog(
  props: ConfirmDialogProps
) {
  const {
    onClose,
    title,
    subtitle,
    width,
    negativeButtonText,
    positiveButtonText,
    positiveButtonVariant,
    message,
    warnings,
    checks,
    inputs
  } = props;
  const checkedItems = useRef<Record<string, boolean>>({});
  const inputItems = useRef<Record<string, string>>({});

  return (
    <Dialog
      testID="confirm-dialog"
      isOpen={true}
      title={title}
      width={width}
      description={subtitle}
      noScroll={!message && !warnings?.length && !inputs && !checks}
      onClose={() => onClose(false)}
      onOpen={() => {
        for (const checkId in checks) {
          checkedItems.current[checkId] = checks[checkId]?.default || false;
        }
        for (const inputId in inputs) {
          inputItems.current[inputId] = inputs[inputId]?.defaultValue || "";
        }
      }}
      positiveButton={
        positiveButtonText
          ? {
              text: positiveButtonText,
              onClick: () =>
                onClose({
                  checks: checkedItems.current,
                  inputs: inputItems.current
                }),
              variant: positiveButtonVariant as never
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
          pb: !negativeButtonText && !positiveButtonText ? "spacing7" : 0,
          mb: "spacing7"
        }}
      >
        {message ? <MarkdownText text={message} /> : null}
        {warnings?.map((text) => (
          <ErrorText key={text} error={text} sx={{ mt: 0 }} />
        ))}
        {inputs
          ? Object.entries(inputs).map(([id, input]) => (
              <Field
                as={input.multiline ? "textarea" : "input"}
                key={id}
                label={input.title}
                helpText={input.helpText}
                defaultValue={input.defaultValue}
                required={input.required}
                onChangeText={(text) => {
                  inputItems.current[id] = text;
                }}
              />
            ))
          : null}
        {checks ? (
          <Box sx={{ mt: "spacing4" }}>
            {Object.entries<Check>(checks).map(([id, check]) => (
              <Flex
                key={id}
                sx={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: "spacing3"
                }}
              >
                <Checkbox
                  testID={id}
                  defaultChecked={check.default}
                  sx={{ width: 18, height: 18 }}
                  onChange={(checked) => (checkedItems.current[id] = checked)}
                />
                <Text
                  variant="body"
                  sx={{ fontSize: "md", color: "paragraph", lineHeight: 1.4 }}
                >
                  {check.text}
                </Text>
              </Flex>
            ))}
          </Box>
        ) : null}
      </Flex>
    </Dialog>
  );
});

export function showMultiDeleteConfirmation(length: number) {
  return ConfirmDialog.show({
    title: strings.doActions.delete.item(length),
    subtitle: strings.moveToTrashDesc(
      db.settings.getTrashCleanupInterval() || 7
    ),
    positiveButtonText: strings.delete(),
    negativeButtonText: strings.no(),
    positiveButtonVariant: "new_error"
  });
}

export function showMultiPermanentDeleteConfirmation(length: number) {
  return ConfirmDialog.show({
    title: strings.doActions.permanentlyDelete.item(length),
    subtitle: strings.irreverisibleAction(),
    positiveButtonText: strings.yes(),
    negativeButtonText: strings.no(),
    positiveButtonVariant: "new_error"
  });
}

export async function showLogoutConfirmation() {
  return await ConfirmDialog.show({
    title: strings.logout(),
    subtitle: strings.logoutConfirmation(),
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
    subtitle: strings.logoutAllOtherDevicesDescription(),
    positiveButtonText: strings.yes(),
    negativeButtonText: strings.no()
  });
}

export function showUnpublishConfirmation() {
  return ConfirmDialog.show({
    title: strings.doActions.unpublish.note(1),
    subtitle: strings.unpublishNoteConfirm(),
    positiveButtonText: strings.yesUnpublish(),
    negativeButtonText: strings.cancel()
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
