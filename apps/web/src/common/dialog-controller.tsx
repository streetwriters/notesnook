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

import ReactDOM from "react-dom";
import { Dialogs } from "../components/dialogs";
import ThemeProvider from "../components/theme-provider";
import qclone from "qclone";
import { store as notebookStore } from "../stores/notebook-store";
import { store as tagStore } from "../stores/tag-store";
import { store as appStore } from "../stores/app-store";
import { store as editorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import { Text } from "@theme-ui/components";
import * as Icon from "../components/icons";
import Config from "../utils/config";
import { AppVersion, getChangelog } from "../utils/version";
import { Period } from "../components/dialogs/buy-dialog/types";
import { FeatureKeys } from "../components/dialogs/feature-dialog";
import { AuthenticatorType } from "../components/dialogs/mfa/types";
import { Suspense } from "react";
import { Reminder } from "@notesnook/core/collections/reminders";
import { ConfirmDialogProps } from "../components/dialogs/confirm";
import { getFormattedDate } from "@notesnook/common";
import { downloadUpdate, installUpdate } from "../utils/updater";

type DialogTypes = typeof Dialogs;
type DialogIds = keyof DialogTypes;
export type Perform<T = boolean> = (result: T) => void;
type RenderDialog<TId extends DialogIds, TReturnType> = (
  dialog: DialogTypes[TId],
  perform: (result: TReturnType) => void
) => JSX.Element;

let openDialogs: Partial<Record<DialogIds, boolean>> = {};
function showDialog<TId extends DialogIds, TReturnType>(
  id: TId,
  render: RenderDialog<TId, TReturnType>
): Promise<TReturnType> {
  return new Promise((resolve) => {
    if (openDialogs[id]) return false;

    const container = document.createElement("div");
    container.id = id;

    const perform = (result: TReturnType) => {
      openDialogs[id] = false;
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
      resolve(result);
    };
    const PropDialog = () => render(Dialogs[id], perform);
    ReactDOM.render(
      <ThemeProvider>
        <Suspense fallback={<div />}>
          <PropDialog />
        </Suspense>
      </ThemeProvider>,
      container,
      () => (openDialogs[id] = true)
    );
  });
}

export function closeOpenedDialog() {
  openDialogs = {};
  const dialogs = document.querySelectorAll(
    ".ReactModalPortal,[data-react-modal-body-trap]"
  );
  dialogs.forEach((elem) => elem.remove());
}

export function showAddTagsDialog(noteIds: string[]) {
  return showDialog("AddTagsDialog", (Dialog, perform) => (
    <Dialog onClose={(res) => perform(res)} noteIds={noteIds} />
  ));
}

export function showAddNotebookDialog() {
  return showDialog("AddNotebookDialog", (Dialog, perform) => (
    <Dialog
      isOpen={true}
      onDone={async (nb: Record<string, unknown>) => {
        // add the notebook to db
        const notebook = await db.notebooks?.add({ ...nb });
        if (!notebook) return perform(false);

        notebookStore.refresh();

        showToast("success", "Notebook added successfully!");
        perform(true);
      }}
      onClose={() => {
        perform(false);
      }}
    />
  ));
}

export function showEditNotebookDialog(notebookId: string) {
  const notebook = db.notebooks?.notebook(notebookId)?.data;
  if (!notebook) return;
  return showDialog("AddNotebookDialog", (Dialog, perform) => (
    <Dialog
      isOpen={true}
      notebook={notebook}
      edit={true}
      onDone={async (nb: Record<string, unknown>, deletedTopics: string[]) => {
        // we remove the topics from notebook
        // beforehand so we can add them manually, later
        const topics = qclone(nb.topics);
        nb.topics = [];

        const notebookId = await db.notebooks?.add(nb);

        // add or delete topics as required
        const notebookTopics = db.notebooks?.notebook(notebookId).topics;
        if (notebookTopics) {
          await notebookTopics.add(...topics);
          await notebookTopics.delete(...deletedTopics);
        }

        notebookStore.refresh();
        noteStore.refresh();
        appStore.refreshNavItems();

        showToast("success", "Notebook edited successfully!");
        perform(true);
      }}
      onClose={() => {
        perform(false);
      }}
    />
  ));
}

export function showBuyDialog(plan?: Period, couponCode?: string) {
  return showDialog("BuyDialog", (Dialog, perform) => (
    <Dialog
      plan={plan}
      couponCode={couponCode}
      onClose={() => perform(false)}
    />
  ));
}

export function confirm<TCheckId extends string>(
  props: Omit<ConfirmDialogProps<TCheckId>, "onClose">
) {
  return showDialog<"Confirm", false | Record<TCheckId, boolean>>(
    "Confirm",
    (Dialog, perform) => (
      <Dialog {...props} onClose={(result) => perform(result)} />
    )
  );
}

export function showPromptDialog(props: {
  title: string;
  description?: string;
  defaultValue?: string;
}) {
  return showDialog<"Prompt", string | null>("Prompt", (Dialog, perform) => (
    <Dialog
      {...props}
      onClose={() => perform(null)}
      onSave={(text) => {
        perform(text);
      }}
    />
  ));
}

export function showEmailChangeDialog() {
  return showDialog("EmailChangeDialog", (Dialog, perform) => (
    <Dialog onClose={() => perform(null)} />
  ));
}

export function showToolbarConfigDialog() {
  return showDialog("ToolbarConfigDialog", (Dialog, perform) => (
    <Dialog onClose={() => perform(null)} />
  ));
}

export function showError(title: string, message: string) {
  return confirm({ title, message, positiveButtonText: "Okay" });
}

export function showMultiDeleteConfirmation(length: number) {
  return confirm({
    title: `Delete ${length} items?`,
    message: `These items will be **kept in your Trash for ${
      db.settings?.getTrashCleanupInterval() || 7
    } days** after which they will be permanently deleted.`,
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showMultiPermanentDeleteConfirmation(length: number) {
  return confirm({
    title: `Permanently delete ${length} items?`,
    message:
      "These items will be **permanently deleted**. This is IRREVERSIBLE.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showLogoutConfirmation() {
  return confirm({
    title: `Logout?`,
    message:
      "Logging out will delete all local data and reset the app. Make sure you have synced your data before logging out.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showClearSessionsConfirmation() {
  return confirm({
    title: `Logout from other devices?`,
    message:
      "All other logged-in devices will be forced to logout stopping sync. Use with care lest you lose important notes.",
    positiveButtonText: "Yes",
    negativeButtonText: "No"
  });
}

export function showAccountLoggedOutNotice(reason?: string) {
  return confirm({
    title: "You were logged out",
    message: reason,
    negativeButtonText: "Okay"
  });
}

export function showAppUpdatedNotice(
  version: AppVersion & { changelog?: string }
) {
  return confirm({
    title: `Welcome to v${version.formatted}`,
    message: `## Changelog:
    
\`\`\`
${version.changelog || "No change log."}
\`\`\`
`,
    positiveButtonText: `Continue`
  });
}

export function showEmailVerificationDialog() {
  return showDialog("EmailVerificationDialog", (Dialog, perform) => (
    <Dialog onCancel={() => perform(false)} />
  ));
}

export function showMigrationDialog() {
  return showDialog("MigrationDialog", (Dialog, perform) => (
    <Dialog onClose={() => perform(false)} />
  ));
}

type LoadingDialogProps<T> = {
  title: string;
  message?: string;
  subtitle: string;
  action: () => T | Promise<T>;
};
export function showLoadingDialog<T>(dialogData: LoadingDialogProps<T>) {
  const { title, message, subtitle, action } = dialogData;
  return showDialog<"LoadingDialog", T | boolean>(
    "LoadingDialog",
    (Dialog, perform) => (
      <Dialog
        title={title}
        description={subtitle}
        message={message}
        action={action}
        onClose={(e) => perform(e as T | boolean)}
      />
    )
  );
}

type ProgressDialogProps = {
  title: string;
  subtitle: string;
  action: (...args: never[]) => void;
};
export function showProgressDialog<T>(dialogData: ProgressDialogProps) {
  const { title, subtitle, action } = dialogData;
  return showDialog<"ProgressDialog", T>(
    "ProgressDialog",
    (Dialog, perform) => (
      <Dialog
        title={title}
        subtitle={subtitle}
        action={action}
        onDone={(e: T) => perform(e)}
      />
    )
  );
}

export function showMoveNoteDialog(noteIds: string[]) {
  return showDialog("MoveDialog", (Dialog, perform) => (
    <Dialog noteIds={noteIds} onClose={(res: boolean) => perform(res)} />
  ));
}

function getDialogData(type: string) {
  switch (type) {
    case "create_vault":
      return {
        title: "Create your vault",
        subtitle: "A vault stores your notes in a password-encrypted storage.",
        positiveButtonText: "Create vault"
      };
    case "clear_vault":
      return {
        title: "Clear your vault",
        subtitle:
          "Enter vault password to unlock and remove all notes from the vault.",
        positiveButtonText: "Clear vault"
      };
    case "delete_vault":
      return {
        title: "Delete your vault",
        subtitle: "Enter your account password to delete your vault.",
        positiveButtonText: "Delete vault",
        checks: [
          { key: "deleteAllLockedNotes", title: "Delete all locked notes?" }
        ]
      };
    case "lock_note":
      return {
        title: "Lock note",
        subtitle: "Please open your vault to encrypt & lock this note.",
        positiveButtonText: "Lock note"
      };
    case "unlock_note":
      return {
        title: "Unlock note",
        subtitle: "Your note will be unencrypted and removed from the vault.",
        positiveButtonText: "Unlock note"
      };
    case "unlock_and_delete_note":
      return {
        title: "Delete note",
        subtitle: "Please unlock this note to move it to trash.",
        positiveButtonText: "Unlock & delete"
      };
    case "change_password":
      return {
        title: "Change vault password",
        subtitle:
          "All locked notes will be re-encrypted with the new password.",
        positiveButtonText: "Change password"
      };
    case "ask_vault_password":
      return {
        title: "Unlock vault",
        subtitle: "Please enter your vault password to continue.",
        positiveButtonText: "Unlock"
      };
    case "ask_backup_password":
      return {
        title: "Encrypted backup",
        subtitle:
          "Please enter the password to decrypt and restore this backup.",
        positiveButtonText: "Restore"
      };
    case "change_account_password":
      return {
        title: "Change account password",
        subtitle: (
          <>
            All your data will be re-encrypted and synced with the new password.
            <Text as="div" mt={1} p={1} bg="errorBg" sx={{ color: "error" }}>
              <Text as="p" my={0} sx={{ color: "inherit" }}>
                It is recommended that you <b>log out from all other devices</b>{" "}
                before continuing.
              </Text>
              <Text as="p" my={0} mt={1} sx={{ color: "inherit" }}>
                If this process is interrupted, there is a high chance of data
                corruption so{" "}
                <b>please do NOT shut down your device or close your browser</b>{" "}
                until this process completes.
              </Text>
            </Text>
          </>
        ),
        positiveButtonText: "Change password"
      };
    case "verify_account":
      return {
        title: "Verify it's you",
        subtitle: "Enter your account password to proceed.",
        positiveButtonText: "Verify"
      };
    case "delete_account":
      return {
        title: "Delete your account",
        subtitle: (
          <Text as="span" sx={{ color: "error" }}>
            All your data will be permanently deleted with{" "}
            <b>no way of recovery</b>. Proceed with caution.
          </Text>
        ),
        positiveButtonText: "Delete Account"
      };
    default:
      return {};
  }
}

export function showPasswordDialog(
  type: string,
  validate: (password: string) => boolean | Promise<boolean>
) {
  const { title, subtitle, positiveButtonText, checks } = getDialogData(type);
  return showDialog("PasswordDialog", (Dialog, perform) => (
    <Dialog
      type={type}
      title={title}
      subtitle={subtitle}
      checks={checks}
      positiveButtonText={positiveButtonText}
      validate={validate}
      onClose={() => perform(false)}
      onDone={() => perform(true)}
    />
  ));
}

export function showRecoveryKeyDialog() {
  return showDialog("RecoveryKeyDialog", (Dialog, perform) => (
    <Dialog onDone={() => perform(true)} />
  ));
}

export function showCreateTopicDialog() {
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Create topic"}
      subtitle={"You can create as many topics as you want."}
      onClose={() => {
        perform(false);
      }}
      onAction={async (topic: Record<string, unknown>) => {
        if (!topic) return;
        const notebook = notebookStore.get().selectedNotebook;
        if (!notebook) return;
        await db.notebooks?.notebook(notebook.id).topics.add(topic);
        notebookStore.setSelectedNotebook(notebook.id);
        showToast("success", "Topic created!");
        perform(true);
      }}
    />
  ));
}

export function showEditTopicDialog(notebookId: string, topicId: string) {
  const topic = db.notebooks?.notebook(notebookId)?.topics?.topic(topicId)
    ?._topic as Record<string, unknown> | undefined;
  if (!topic) return;
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Edit topic"}
      subtitle={`You are editing "${topic.title}" topic.`}
      defaultValue={topic.title}
      icon={Icon.Topic}
      item={topic}
      onClose={() => perform(false)}
      onAction={async (t: string) => {
        await db.notebooks
          ?.notebook(topic.notebookId as string)
          .topics.add({ ...topic, title: t });
        notebookStore.setSelectedNotebook(topic.notebookId);
        appStore.refreshNavItems();
        showToast("success", "Topic edited!");
        perform(true);
      }}
    />
  ));
}

export function showCreateTagDialog() {
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Create tag"}
      subtitle={"You can create as many tags as you want."}
      onClose={() => {
        perform(false);
      }}
      onAction={async (title: string) => {
        if (!title) return showToast("error", "Tag title cannot be empty.");
        try {
          await db.tags?.add(title);
          showToast("success", "Tag created!");
          tagStore.refresh();
          perform(true);
        } catch (e) {
          if (e instanceof Error) showToast("error", e.message);
        }
      }}
    />
  ));
}

export function showEditTagDialog(tagId: string) {
  const tag = db.tags?.tag(tagId);
  if (!tag) return;
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Edit tag"}
      subtitle={`You are editing #${db.tags?.alias(tag.id)}.`}
      defaultValue={db.tags?.alias(tag.id)}
      item={tag}
      onClose={() => perform(false)}
      onAction={async (title: string) => {
        if (!title) return;
        await db.tags?.rename(tagId, title);
        showToast("success", "Tag edited!");
        tagStore.refresh();
        editorStore.refreshTags();
        noteStore.refresh();
        appStore.refreshNavItems();
        perform(true);
      }}
    />
  ));
}

export function showRenameColorDialog(colorId: string) {
  const color = db.colors?.tag(colorId);
  if (!color) return;
  return showDialog("ItemDialog", (Dialog, perform) => (
    <Dialog
      title={"Rename color"}
      subtitle={`You are renaming color ${db.colors?.alias(color.id)}.`}
      item={color}
      defaultValue={db.colors?.alias(color.id)}
      onClose={() => perform(false)}
      onAction={async (title: string) => {
        if (!title) return;
        await db.colors?.rename(colorId, title);
        showToast("success", "Color renamed!");
        appStore.refreshNavItems();
        perform(true);
      }}
    />
  ));
}

export function showFeatureDialog(featureName: FeatureKeys) {
  return showDialog("FeatureDialog", (Dialog, perform) => (
    <Dialog featureName={featureName} onClose={(res) => perform(res)} />
  ));
}

export function showReminderDialog(reminderKey: string) {
  if (Config.get(reminderKey, false)) return;

  return showDialog("ReminderDialog", (Dialog, perform) => (
    <Dialog
      reminderKey={reminderKey}
      onClose={(res: boolean) => {
        Config.set(reminderKey, true);
        perform(res);
      }}
    />
  ));
}

export function showReminderPreviewDialog(reminder: Reminder) {
  return showDialog("ReminderPreviewDialog", (Dialog, perform) => (
    <Dialog reminder={reminder} onClose={perform} />
  ));
}

export function showAddReminderDialog(noteId?: string) {
  return showDialog("AddReminderDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} noteId={noteId} />
  ));
}

export function showEditReminderDialog(reminderId: string) {
  return showDialog("AddReminderDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} reminderId={reminderId} />
  ));
}

export function showAnnouncementDialog(announcement: { id: string }) {
  return showDialog("AnnouncementDialog", (Dialog, perform) => (
    <Dialog
      announcement={announcement}
      onClose={(res: boolean) => perform(res)}
    />
  ));
}

export function showIssueDialog() {
  return showDialog("IssueDialog", (Dialog, perform) => (
    <Dialog
      onClose={(res: boolean) => {
        perform(res);
      }}
    />
  ));
}

export function showMultifactorDialog(primaryMethod?: AuthenticatorType) {
  return showDialog("MultifactorDialog", (Dialog, perform) => (
    <Dialog onClose={(res) => perform(res)} primaryMethod={primaryMethod} />
  ));
}

export function show2FARecoveryCodesDialog(primaryMethod: AuthenticatorType) {
  return showDialog("RecoveryCodesDialog", (Dialog, perform) => (
    <Dialog onClose={(res) => perform(res)} primaryMethod={primaryMethod} />
  ));
}

export function showAttachmentsDialog() {
  return showDialog("AttachmentsDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} />
  ));
}

export function showSettings() {
  return showDialog("SettingsDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} />
  ));
}

export function showOnboardingDialog(type: string) {
  if (!type) return;
  return showDialog("OnboardingDialog", (Dialog, perform) => (
    <Dialog type={type} onClose={(res: boolean) => perform(res)} />
  ));
}

export async function showInvalidSystemTimeDialog({
  serverTime,
  localTime
}: {
  serverTime: number;
  localTime: number;
}) {
  const result = await confirm({
    title: "Your system clock is out of sync",
    subtitle:
      "Please correct your system date & time and reload the app to avoid syncing issues.",
    message: `Server time: ${getFormattedDate(serverTime)}
Local time: ${getFormattedDate(localTime)}
Please sync your system time with [https://time.is](https://time.is).`,
    positiveButtonText: "Reload app"
  });
  if (result) window.location.reload();
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

export async function showUpdateReadyNotice({ version }: { version: string }) {
  const changelog = await getChangelog(version);
  return await showUpdateDialog({
    title: `Update ready for installation`,
    subtitle: `v${version} is ready to be installed.`,
    changelog,
    action: {
      text: "Install now",
      onClick: () => installUpdate()
    }
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
  const result = await confirm({
    title,
    subtitle,
    message: changelog,
    width: 500,
    positiveButtonText: action.text
  });
  if (result && action.onClick) action.onClick();
}
