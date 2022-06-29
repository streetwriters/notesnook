import ReactDOM from "react-dom";
import Dialogs from "../components/dialogs";
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

import { formatDate } from "notes-core/utils/date";
import downloadUpdate from "../commands/download-update";
import installUpdate from "../commands/install-update";
import { AppVersion, getChangelog } from "../utils/version";
import { isDesktop } from "../utils/platform";
import { Period } from "../components/dialogs/buy-dialog/types";
import { AuthenticatorType } from "../components/dialogs/multi-factor-dialog";
import { FeatureKeys } from "../components/dialogs/feature-dialog";

type DialogIds = keyof DialogTypes;
type DialogTypes = typeof Dialogs;
export type Perform = (result: boolean) => void;
type RenderDialog<TId extends DialogIds, TReturnType> = (
  dialog: DialogTypes[TId],
  perform: (result: TReturnType) => void
) => JSX.Element;

const openDialogs: Partial<Record<DialogIds, boolean>> = {};
function showDialog<TId extends DialogIds, TReturnType>(
  id: TId,
  render: RenderDialog<TId, TReturnType>
): Promise<TReturnType> {
  return new Promise((resolve, reject) => {
    if (openDialogs[id]) return false;

    const container = document.createElement("div");
    container.id = id;

    const perform = (result: TReturnType) => {
      openDialogs[id] = false;
      ReactDOM.unmountComponentAtNode(container);
      container.remove();
      hashNavigate("/", { replace: true, notify: false });
      resolve(result);
    };
    const PropDialog = render(Dialogs[id], perform);
    ReactDOM.render(
      <ThemeProvider>{PropDialog}</ThemeProvider>,
      container,
      () => (openDialogs[id] = true)
    );
  });
}

export function closeOpenedDialog() {
  const dialogs = document.querySelectorAll(".ReactModalPortal");
  dialogs.forEach((elem) => elem.remove());
}

export function showAddNotebookDialog() {
  return showDialog("AddNotebookDialog", (Dialog, perform) => (
    <Dialog
      isOpen={true}
      onDone={async (nb: any) => {
        // add the notebook to db
        await db.notebooks?.add({ ...nb });
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
  if (!notebook) return false;
  return showDialog("AddNotebookDialog", (Dialog, perform) => (
    <Dialog
      isOpen={true}
      notebook={notebook}
      edit={true}
      onDone={async (nb: any, deletedTopics: string[]) => {
        // we remove the topics from notebook
        // beforehand so we can add them manually, later
        const topics = qclone(nb.topics);
        nb.topics = [];

        let notebookId = await db.notebooks?.add(nb);

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

type ConfirmDialogProps = {
  title?: string;
  subtitle?: string;
  message?: string | JSX.Element;
  yesText?: string;
  noText?: string;
  yesAction?: () => void;
  width?: string;
};
export function confirm(props: ConfirmDialogProps) {
  return showDialog("Confirm", (Dialog, perform) => (
    <Dialog
      {...props}
      onNo={() => perform(false)}
      onYes={() => {
        if (props.yesAction) props.yesAction();
        perform(true);
      }}
    />
  ));
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

export function showToolbarConfigDialog() {
  return showDialog<"ToolbarConfigDialog", string | null>(
    "ToolbarConfigDialog",
    (Dialog, perform) => <Dialog onClose={() => perform(null)} />
  );
}

export function showError(title: string, message: string) {
  return confirm({ title, message, yesText: "Okay" });
}

export function showMultiDeleteConfirmation(length: number) {
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

export function showMultiPermanentDeleteConfirmation(length: number) {
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

export function showAccountLoggedOutNotice(reason?: string) {
  return confirm({
    title: "You were logged out",
    message: reason,
    noText: "Okay",
    yesText: `Relogin`,
    yesAction: () => hardNavigate("/login"),
  });
}

export function showAppUpdatedNotice(
  version: AppVersion & { changelog?: string }
) {
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
  return showDialog("EmailVerificationDialog", (Dialog, perform) => (
    <Dialog onCancel={() => perform(false)} />
  ));
}

type LoadingDialogProps = {
  title: string;
  message?: string;
  subtitle: string;
  action: () => void;
};
export function showLoadingDialog(dialogData: LoadingDialogProps) {
  const { title, message, subtitle, action } = dialogData;
  return showDialog("LoadingDialog", (Dialog, perform) => (
    <Dialog
      title={title}
      subtitle={subtitle}
      message={message}
      action={action}
      onDone={(e: boolean) => perform(e)}
    />
  ));
}

type ProgressDialogProps = {
  title: string;
  subtitle: string;
  action: any;
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
    case "unlock_and_delete_note":
      return {
        title: "Delete note",
        subtitle: "Please unlock this note to move it to trash.",
        positiveButtonText: "Unlock & delete",
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
      return {};
  }
}

export function showPasswordDialog(
  type: string,
  validate: (password: string) => boolean
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
      onAction={async (topic: any) => {
        if (!topic) return;
        const notebookId = notebookStore.get().selectedNotebookId;
        await db.notebooks?.notebook(notebookId).topics.add(topic);
        notebookStore.setSelectedNotebook(notebookId);
        showToast("success", "Topic created!");
        perform(true);
      }}
    />
  ));
}

export function showEditTopicDialog(notebookId: string, topicId: string) {
  const topic: any = db.notebooks
    ?.notebook(notebookId)
    ?.topics?.topic(topicId)?._topic;
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
          ?.notebook(topic.notebookId)
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

export function showTrackingDetailsDialog() {
  return showDialog("TrackingDetailsDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} />
  ));
}

export function showAnnouncementDialog(
  announcement: any,
  remove: (id: string) => void
) {
  return showDialog("AnnouncementDialog", (Dialog, perform) => (
    <Dialog
      announcement={announcement}
      removeAnnouncement={() => remove(announcement.id)}
      onClose={(res: boolean) => {
        remove(announcement.id);
        perform(res);
      }}
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

export function showImportDialog() {
  return showDialog("ImportDialog", (Dialog, perform) => (
    <Dialog onClose={(res: boolean) => perform(res)} />
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

export function showOnboardingDialog(type: string) {
  if (!type) return;
  return showDialog("OnboardingDialog", (Dialog, perform) => (
    <Dialog type={type} onClose={(res: boolean) => perform(res)} />
  ));
}

export function showInvalidSystemTimeDialog({
  serverTime,
  localTime,
}: {
  serverTime: number;
  localTime: number;
}) {
  return confirm({
    title: "Your system clock is out of sync",
    subtitle:
      "Please correct your system date & time and reload the app to avoid syncing issues.",
    message: (
      <>
        Server time:{" "}
        {formatDate(serverTime, { dateStyle: "medium", timeStyle: "medium" })}
        <br />
        Local time:{" "}
        {formatDate(localTime, { dateStyle: "medium", timeStyle: "medium" })}
        <br />
        Please sync your system time with{" "}
        <a href="https://time.is">https://time.is/</a>.
      </>
    ),
    yesText: "Reload app",
    yesAction: () => window.location.reload(),
  });
}

export function showUpdateAvailableNotice({
  changelog,
  version,
}: {
  changelog: string;
  version: string;
}) {
  return showUpdateDialog({
    title: `New version available`,
    subtitle: `v${version} is available for download`,
    changelog,
    action: { text: `Update now`, onClick: () => downloadUpdate() },
  });
}

export async function showUpdateReadyNotice({ version }: { version: string }) {
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

type UpdateDialogProps = {
  title: string;
  subtitle: string;
  changelog: string;
  action: {
    text: string;
    onClick: () => void;
  };
};
function showUpdateDialog({
  title,
  subtitle,
  changelog,
  action,
}: UpdateDialogProps) {
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
