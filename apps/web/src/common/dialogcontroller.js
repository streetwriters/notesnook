import React from "react";
import ReactDOM from "react-dom";
import { hardNavigate, hashNavigate } from "../navigation";
import ThemeProvider from "../components/theme-provider";
import { qclone } from "qclone";
import { store as notebookStore } from "../stores/notebook-store";
import { store as tagStore } from "../stores/tag-store";
import { store as appStore } from "../stores/app-store";
import { store as editorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import { Box, Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import Config from "../utils/config";
import Dialogs from "../components/dialogs";
import { formatDate } from "notes-core/utils/date";
import downloadUpdate from "../commands/download-update";
import installUpdate from "../commands/install-update";
import { getChangelog } from "../utils/version";
import { isDesktop } from "../utils/platform";

function showDialog(dialog) {
  const root = document.getElementById("dialogContainer");

  if (root) {
    return new Promise((resolve, reject) => {
      const perform = (result) => {
        ReactDOM.unmountComponentAtNode(root);
        hashNavigate("/", { replace: true });
        resolve(result);
      };
      const PropDialog = dialog(Dialogs, perform);

      ReactDOM.render(<ThemeProvider>{PropDialog}</ThemeProvider>, root);
    });
  }
  return Promise.reject("No element with id 'dialogContainer'");
}

export function closeOpenedDialog() {
  const root = document.getElementById("dialogContainer");
  if (!root.childElementCount) return;
  ReactDOM.unmountComponentAtNode(root);
}

export function showEditNotebookDialog(notebookId) {
  const notebook = db.notebooks.notebook(notebookId)?.data;
  if (!notebook) return false;
  return showDialog((Dialogs, perform) => (
    <Dialogs.AddNotebookDialog
      isOpen={true}
      notebook={notebook}
      edit={true}
      onDone={async (nb, deletedTopics) => {
        // we remove the topics from notebook
        // beforehand so we can add them manually, later
        const topics = qclone(nb.topics);
        nb.topics = [];

        let notebookId = await db.notebooks.add(nb);

        // add or delete topics as required
        const notebookTopics = db.notebooks.notebook(notebookId).topics;
        await notebookTopics.add(...topics);
        await notebookTopics.delete(...deletedTopics);

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

export function showAddNotebookDialog() {
  return showDialog((Dialogs, perform) => (
    <Dialogs.AddNotebookDialog
      isOpen={true}
      onDone={async (nb) => {
        // add the notebook to db
        await db.notebooks.add({ ...nb });
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

export function showBuyDialog(plan, couponCode) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.BuyDialog
      plan={plan}
      couponCode={couponCode}
      onClose={() => perform(false)}
    />
  ));
}

export function confirm({
  title,
  subtitle,
  message,
  yesText,
  noText,
  yesAction,
  width,
}) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.Confirm
      title={title}
      subtitle={subtitle}
      message={message}
      yesText={yesText}
      width={width}
      noText={noText}
      onNo={() => perform(false)}
      onYes={() => {
        if (yesAction) yesAction();
        perform(true);
      }}
    />
  ));
}

export function showMultiDeleteConfirmation(length) {
  return confirm({
    title: `Delete ${length} items?`,
    message: (
      <Text as="span">
        These items will be{" "}
        <Text as="span" color="primary">
          kept in your Trash for 7 days
        </Text>{" "}
        after which they will be permanently removed.
      </Text>
    ),
    yesText: `Delete selected`,
    noText: "Cancel",
  });
}

export function showMultiPermanentDeleteConfirmation(length) {
  return confirm({
    title: `Permanently delete ${length} items?`,
    message: (
      <Text as="span">
        These items will be{" "}
        <Text as="span" color="primary">
          permanently deleted
        </Text>
        {". "}
        This action is IRREVERSIBLE.
      </Text>
    ),
    yesText: `Permanently delete selected`,
    noText: "Cancel",
  });
}

export function showLogoutConfirmation() {
  return confirm({
    title: `Logout?`,
    message:
      "Logging out will delete all local data and reset the app. Make sure you have synced your data before logging out.",
    yesText: `Yes`,
    noText: "No",
  });
}

export function showClearSessionsConfirmation() {
  return confirm({
    title: `Logout from other devices?`,
    message:
      "All other logged-in devices will be forced to logout stopping sync. Use with care lest you lose important notes.",
    yesText: `Yes`,
    noText: "No",
  });
}

// export function showAccountDeletedNotice() {
//   return confirm(Icon.Logout, {
//     title: `Account deleted`,
//     message:
//       "You deleted your account from another device. You have been logged out.",
//     yesText: `Okay`,
//   });
// }

// export function showPasswordChangedNotice() {
//   return confirm(Icon.Logout, {
//     title: `Account password changed`,
//     message:
//       "Your account password was changed, please login again using the new password.",
//     yesText: `Okay`,
//   });
// }

export function showAccountLoggedOutNotice(reason) {
  return confirm({
    title: "You were logged out",
    message: reason,
    noText: "Okay",
    yesText: `Relogin`,
    yesAction: () => hardNavigate("/login"),
  });
}

export function showAppUpdatedNotice(version) {
  return confirm({
    title: `Welcome to v${version.formatted}`,
    message: (
      <Flex
        flexDirection="column"
        bg="bgSecondary"
        p={1}
        sx={{ borderRadius: "default" }}
      >
        <Text variant="title">Changelog:</Text>
        <Text
          as="pre"
          overflow="auto"
          fontFamily="monospace"
          variant="body"
          mt={1}
        >
          {version.changelog || "No change log."}
        </Text>
      </Flex>
    ),
    yesText: `Yay!`,
  });
}

export function showEmailVerificationDialog() {
  return showDialog((Dialogs, perform) => (
    <Dialogs.EmailVerificationDialog onCancel={() => perform(false)} />
  ));
}

export function showExportDialog(noteIds) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.ExportDialog
      noteIds={noteIds}
      title={
        noteIds.length > 1 ? `Export ${noteIds.length} notes` : "Export note"
      }
      icon={Icon.Export}
      onClose={() => perform(false)}
      onDone={() => perform(true)}
    />
  ));
}

export function showLoadingDialog(dialogData) {
  const { title, message, subtitle, action } = dialogData;
  return showDialog((Dialogs, perform) => (
    <Dialogs.LoadingDialog
      title={title}
      subtitle={subtitle}
      message={message}
      action={action}
      onDone={(e) => perform(e)}
    />
  ));
}

/**
 *
 * @param {{title: string, subtitle?: string, action: Function}} dialogData
 * @returns
 */
export function showProgressDialog(dialogData) {
  const { title, subtitle, action } = dialogData;
  return showDialog((Dialogs, perform) => (
    <Dialogs.ProgressDialog
      title={title}
      subtitle={subtitle}
      action={action}
      onDone={(e) => perform(e)}
    />
  ));
}

export function showMoveNoteDialog(noteIds) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.MoveDialog
      noteIds={noteIds}
      onClose={() => perform(false)}
      onMove={() => perform(true)}
    />
  ));
}

function getDialogData(type) {
  switch (type) {
    case "create_vault":
      return {
        title: "Create your vault",
        subtitle: "A vault stores your notes in a password-encrypted storage.",
        positiveButtonText: "Create vault",
      };
    case "clear_vault":
      return {
        title: "Clear your vault",
        subtitle:
          "Enter vault password to unlock and remove all notes from the vault.",
        positiveButtonText: "Clear vault",
      };
    case "delete_vault":
      return {
        title: "Delete your vault",
        subtitle: "Enter your account password to delete your vault.",
        positiveButtonText: "Delete vault",
        checks: [
          { key: "deleteAllLockedNotes", title: "Delete all locked notes?" },
        ],
      };
    case "lock_note":
      return {
        title: "Lock note",
        subtitle: "Please open your vault to encrypt & lock this note.",
        positiveButtonText: "Lock note",
      };
    case "unlock_note":
      return {
        title: "Unlock note",
        subtitle: "Your note will be unencrypted and removed from the vault.",
        positiveButtonText: "Unlock note",
      };
    case "change_password":
      return {
        title: "Change vault password",
        subtitle:
          "All locked notes will be re-encrypted with the new password.",
        positiveButtonText: "Change password",
      };
    case "ask_vault_password":
      return {
        title: "Unlock vault",
        subtitle: "Please enter your vault password to continue.",
        positiveButtonText: "Unlock",
      };
    case "ask_backup_password":
      return {
        title: "Encrypted backup",
        subtitle:
          "Please enter the password to decrypt and restore this backup.",
        positiveButtonText: "Restore",
      };
    case "change_account_password":
      return {
        title: "Change account password",
        subtitle: (
          <>
            All your data will be re-encrypted and synced with the new password.
            <Box mt={1} p={1} bg="errorBg" color="error">
              <Text as="p" my={0}>
                It is recommended that you <b>log out from all other devices</b>{" "}
                before continuing.
              </Text>
              <Text as="p" my={0} mt={1}>
                If this process is interrupted, there is a high chance of data
                corruption so{" "}
                <b>please do NOT shut down your device or close your browser</b>{" "}
                until this process completes.
              </Text>
            </Box>
          </>
        ),
        positiveButtonText: "Change password",
      };
    case "verify_account":
      return {
        title: "Verify it's you",
        subtitle: "Enter your account password to proceed.",
        positiveButtonText: "Verify",
      };
    case "delete_account":
      return {
        title: "Delete your account",
        subtitle: (
          <Text as="span" color="error">
            All your data will be permanently deleted with{" "}
            <b>no way of recovery</b>. Proceed with caution.
          </Text>
        ),
        positiveButtonText: "Delete Account",
      };
    default:
      return;
  }
}

export function showPasswordDialog(type, validate) {
  const { title, subtitle, positiveButtonText, checks } = getDialogData(type);
  return showDialog((Dialogs, perform) => (
    <Dialogs.PasswordDialog
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
  return showDialog((Dialogs, perform) => (
    <Dialogs.RecoveryKeyDialog onDone={() => perform(true)} />
  ));
}

export function showCreateTopicDialog() {
  return showDialog((Dialogs, perform) => (
    <Dialogs.ItemDialog
      title={"Create topic"}
      subtitle={"You can create as many topics as you want."}
      onClose={() => {
        perform(false);
      }}
      onAction={async (topic) => {
        if (!topic) return;
        const notebookId = notebookStore.get().selectedNotebookId;
        await db.notebooks.notebook(notebookId).topics.add(topic);
        notebookStore.setSelectedNotebook(notebookId);
        showToast("success", "Topic created!");
        perform(true);
      }}
    />
  ));
}

export function showEditTopicDialog(notebookId, topicId) {
  const topic = db.notebooks
    .notebook(notebookId)
    ?.topics?.topic(topicId)?._topic;
  if (!topic) return;
  return showDialog((Dialogs, perform) => (
    <Dialogs.ItemDialog
      title={"Edit topic"}
      subtitle={`You are editing "${topic.title}" topic.`}
      defaultValue={topic.title}
      icon={Icon.Topic}
      item={topic}
      onClose={() => perform(false)}
      onAction={async (t) => {
        await db.notebooks
          .notebook(topic.notebookId)
          .topics.add({ ...topic, title: t });
        notebookStore.setSelectedNotebook(topic.notebookId);
        showToast("success", "Topic edited!");
        perform(true);
      }}
    />
  ));
}

export function showCreateTagDialog() {
  return showDialog((Dialogs, perform) => (
    <Dialogs.ItemDialog
      title={"Create tag"}
      subtitle={"You can create as many tags as you want."}
      onClose={() => {
        perform(false);
      }}
      onAction={async (title) => {
        if (!title) return showToast("error", "Tag title cannot be empty.");
        try {
          await db.tags.add(title);
          showToast("success", "Tag created!");
          tagStore.refresh();
          perform(true);
        } catch (e) {
          showToast("error", e.message);
        }
      }}
    />
  ));
}

export function showEditTagDialog(tagId) {
  const tag = db.tags.tag(tagId);
  if (!tag) return;
  return showDialog((Dialogs, perform) => (
    <Dialogs.ItemDialog
      title={"Edit tag"}
      subtitle={`You are editing #${db.tags.alias(tag.id)}.`}
      defaultValue={db.tags.alias(tag.id)}
      item={tag}
      onClose={() => perform(false)}
      onAction={async (title) => {
        if (!title) return;
        await db.tags.rename(tagId, title);
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

export function showRenameColorDialog(colorId) {
  const color = db.colors.tag(colorId);
  if (!color) return;
  return showDialog((Dialogs, perform) => (
    <Dialogs.ItemDialog
      title={"Rename color"}
      subtitle={`You are renaming color ${db.colors.alias(color.id)}.`}
      item={color}
      defaultValue={db.colors.alias(color.id)}
      onClose={() => perform(false)}
      onAction={async (title) => {
        if (!title) return;
        await db.colors.rename(colorId, title);
        showToast("success", "Color renamed!");
        appStore.refreshNavItems();
        perform(true);
      }}
    />
  ));
}

export function showFeatureDialog(featureName) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.FeatureDialog
      featureName={featureName}
      onClose={(res) => perform(res)}
    />
  ));
}

export function showReminderDialog(reminderKey) {
  if (Config.get(reminderKey, false)) return;

  return showDialog((Dialogs, perform) => (
    <Dialogs.ReminderDialog
      reminderKey={reminderKey}
      onClose={(res) => {
        Config.set(reminderKey, true);
        perform(res);
      }}
    />
  ));
}

export function showTrackingDetailsDialog() {
  return showDialog((Dialogs, perform) => (
    <Dialogs.TrackingDetailsDialog onClose={(res) => perform(res)} />
  ));
}

export function showAnnouncementDialog(announcement, remove) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.AnnouncementDialog
      announcement={announcement}
      onClose={(res) => {
        remove(announcement.id);
        perform(res);
      }}
    />
  ));
}

export function showIssueDialog() {
  return showDialog((Dialogs, perform) => (
    <Dialogs.IssueDialog
      onClose={(res) => {
        perform(res);
      }}
    />
  ));
}

export function showImportDialog() {
  return showDialog((Dialogs, perform) => (
    <Dialogs.ImportDialog onClose={(res) => perform(res)} />
  ));
}

export function showOnboardingDialog(type) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.OnboardingDialog type={type} onClose={(res) => perform(res)} />
  ));
}

export function showInvalidSystemTimeDialog({ serverTime, localTime }) {
  return showDialog((Dialogs) => (
    <Dialogs.Confirm
      title={"Your system clock is out of sync"}
      subtitle={
        "Please correct your system date & time and reload the app to avoid syncing issues."
      }
      message={
        <>
          Server time:{" "}
          {formatDate(serverTime, { dateStyle: "medium", timeStyle: "medium" })}
          <br />
          Local time:{" "}
          {formatDate(localTime, { dateStyle: "medium", timeStyle: "medium" })}
        </>
      }
      yesText="Reload app"
      onYes={() => window.location.reload()}
    />
  ));
}

export function showUpdateAvailableNotice({ changelog, version }) {
  return showUpdateDialog({
    title: `New version available`,
    subtitle: `v${version} is available for download`,
    changelog,
    action: { text: `Update now`, onClick: () => downloadUpdate() },
  });
}

export async function showUpdateReadyNotice({ version }) {
  const changelog = isDesktop() ? null : await getChangelog(version);
  return await showUpdateDialog({
    title: `Update ready for installation`,
    subtitle: `v${version} is ready to be installed.`,
    changelog,
    action: {
      text: "Install now",
      onClick: () => installUpdate(),
    },
  });
}

function showUpdateDialog({ title, subtitle, changelog, action }) {
  return confirm({
    title,
    subtitle,
    message: changelog && (
      <Flex flexDirection="column" sx={{ borderRadius: "default" }}>
        <Text
          as="div"
          overflow="auto"
          variant="body"
          sx={{ overflow: "auto", fontFamily: "body" }}
          css={`
            h2 {
              font-size: 1.2em;
              font-weight: 600;
            }
            h3 {
              font-size: 1em;
              font-weight: 600;
            }
          `}
          dangerouslySetInnerHTML={{ __html: changelog }}
        ></Text>
      </Flex>
    ),
    width: "500px",
    yesText: action.text,
    yesAction: action.onClick,
  });
}
