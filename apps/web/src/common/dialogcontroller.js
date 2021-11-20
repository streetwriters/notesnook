import React from "react";
import ReactDOM from "react-dom";
import { hashNavigate } from "../navigation";
import ThemeProvider from "../components/theme-provider";
import { qclone } from "qclone";
import { store as notebookStore } from "../stores/notebook-store";
import { store as tagStore } from "../stores/tag-store";
import { store as appStore } from "../stores/app-store";
import { store as editorStore } from "../stores/editor-store";
import { store as noteStore } from "../stores/note-store";
import { db } from "./db";
import { showToast } from "../utils/toast";
import { Flex, Text } from "rebass";
import * as Icon from "../components/icons";
import Config from "../utils/config";
import Dialogs from "../components/dialogs";

function showDialog(dialog) {
  const root = document.getElementById("dialogContainer");

  if (root) {
    return new Promise((resolve) => {
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
        delete nb.topics;

        let notebookId = await db.notebooks.add(nb);

        // add or delete topics as required
        const notebookTopics = db.notebooks.notebook(notebookId).topics;
        await notebookTopics.delete(...deletedTopics);
        await notebookTopics.add(...topics);

        notebookStore.refresh();
        appStore.refreshMenuPins();

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
}) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.Confirm
      title={title}
      subtitle={subtitle}
      message={message}
      yesText={yesText}
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
    title: reason,
    message: `You were logged out`,
    yesText: `Okay`,
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

export function showAppAvailableNotice(version) {
  return confirm({
    title: `New version available`,
    message: (
      <Flex
        flexDirection="column"
        bg="bgSecondary"
        p={1}
        sx={{ borderRadius: "default" }}
      >
        <Text variant="title">v{version.formatted} changelog:</Text>
        <Text
          overflow="auto"
          as="pre"
          fontFamily="monospace"
          variant="body"
          mt={1}
          sx={{ overflow: "auto" }}
        >
          {version.changelog || "No change log."}
        </Text>
      </Flex>
    ),
    yesText: `Update now`,
    yesAction: () => window.location.reload(),
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

export function showProgressDialog(dialogData) {
  const { title, message, subtitle, total, setProgress, action } = dialogData;
  return showDialog((Dialogs, perform) => (
    <Dialogs.ProgressDialog
      title={title}
      subtitle={subtitle}
      message={message}
      total={total}
      setProgress={setProgress}
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
    case "change_account_password":
      return {
        title: "Change account password",
        subtitle:
          "All your data will be re-encrypted and synced with the new password.",
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
        appStore.refreshColors();
        perform(true);
      }}
    />
  ));
}

export function showSessionExpiredDialog(email) {
  return showDialog((Dialogs, perform) => (
    <Dialogs.SessionExpiredDialog
      email={email}
      onClose={(res) => perform(res)}
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
