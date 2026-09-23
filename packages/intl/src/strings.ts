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
import { plural, select, t } from "@lingui/core/macro";
import { actionConfirmations } from "../generated/action-confirmations";
import { actionErrors } from "../generated/action-errors";
import { actions } from "../generated/actions";
import { doActions } from "../generated/do-actions";
import { inProgressActions } from "../generated/in-progress-actions";

const SEARCH_IN_ROUTE_STRINGS = {
  Notes: () => t`Search in Notes`,
  Notebooks: () => t`Search in Notebooks`,
  Notebook: () => t`Search in Notebook`,
  Favorites: () => t`Search in Favorites`,
  Reminders: () => t`Search in Reminders`,
  Trash: () => t`Search in Trash`,
  Settings: () => t`Search in Settings`,
  Tags: () => t`Search in Tags`,
  Editor: () => t`Search in Editor`,
  Home: () => t`Search in Home`,
  Search: () => t`Search in Search`,
  Monographs: () => t`Search in Monographs`
};

const TRANSACTION_STATUS = {
  completed: () => t`Completed`,
  refunded: () => t`"Refunded`,
  partially_refunded: () => t`Partially refunded`,
  disputed: () => t`Disputed`
};

const REMINDER_NOTIFICATION_MODES = {
  Silent: () => t`Silent`,
  Vibrate: () => t`Vibrate`,
  Urgent: () => t`Urgent`
};

export const strings = {
  done: () => t`Done`,
  verifyItsYou: () => t`Please verify it's you`,
  unlockNotes: () => t`Unlock your notes`,
  note: () => t`Note`,
  notes: (count: number) =>
    plural(count, {
      one: `# note`,
      other: `# notes`
    }),
  downloading: () => strings.network.downloading(),
  networkProgress: (type: "upload" | "download" | "sync") =>
    select(type, {
      upload: "Uploading",
      download: "Downloading",
      sync: "Syncing",
      other: "Loading"
    }),
  attachmentsDownloadFailed: (count: number) =>
    plural(count, {
      one: "Failed to download attachment",
      other: "Failed to download # attachments"
    }),
  noAttachments: () => t`No attachments.`,
  recoveryEmailSent: () => t`Recovery email sent!`,
  recoveryEmailSentDesc: () =>
    t`Recovery email has been sent to your email address. Please check your inbox and follow the instructions to recover your account.`,
  dontHaveAccount: () => t`Don't have an account?`,
  signUp: () => t`Sign up`,
  sessionExpired: () => t`Session expired`,
  sessionExpiredDesc: (obfuscatedEmail: string) =>
    t`Your session has expired. Please enter password for ${obfuscatedEmail} to continue.`,
  signupAgreement: {
    0: () => t`By signing up, you agree to our `,
    1: () => t`Terms of Service `,
    2: () => t`and `,
    3: () => t`Privacy Policy. `,
    4: () =>
      t`You also agree to receive marketing emails from us which you can opt-out of from app settings.`
  },
  alreadyHaveAccount: () => t`Already have an account?`,
  login: () => t`Login`,
  "2fa": () => t`Two factor authentication`,
  select2faMethod: () => t`Select method for two-factor authentication`,
  select2faCodeHelpText: () => t`Select how you would like to receive the code`,
  "2faCodeHelpText": {
    email: () =>
      t`Enter the 6 digit code sent to your email to continue logging in`,
    sms: () =>
      t`Enter the 6 digit code sent to your phone number to continue logging in`,
    app: () =>
      t`Enter the 6 digit code from your authenticator app to continue logging in`,
    recoveryCode: () => t`Enter the recovery code to continue logging in`
  },
  "2faCodeSecondaryMethodText": {
    email: () => t`I don't have access to email`,
    sms: () => t`I don't have access to my phone`,
    app: () => t`I don't have access to authenticator app`,
    recoveryCode: () => t`I don't have recovery codes`
  },
  resend2faCode: (seconds: string) => t`Resend code in (${seconds})`,
  sendCode: () => t`Send code`,
  sendCodeSms: () => t`Send code via SMS`,
  sendCodeEmail: () => t`Send code via email`,
  authAppCode: () => t`Enter code from authenticator app`,
  recoveryCode: () => t`I have a recovery code`,
  attachImageHeading: (count: number) =>
    plural(count, {
      one: "Attach image",
      other: "Attach # images"
    }),
  compress: () => t`Compress`,
  recommended: () => t`Recommended`,
  compressionOffNotice: () =>
    t`Images uploaded without compression are slow to load and take more bandwidth. We recommend compressing images unless you need image in original quality.`,
  compressionOnNotice: () =>
    t`Compressed images are uploaded in Full HD resolution and usually are good enough for most use cases.`,
  loadingWithProgress: (progress: string) =>
    t`Loading ${progress ? `(${progress})` : ""}, please wait...`,
  vaultEnableBiometrics: () =>
    t` Unlock with password once to enable biometric access.`,
  deleteVault: () => t`Delete vault`,
  clearVault: () => t`Clear vault`,
  enable: () => t`Enable`,
  revoke: () => t`Revoke`,
  change: () => t`Change`,
  delete: () => t`Delete`,
  share: () => t`Share`,
  open: () => t`Open`,
  unlock: () => t`Unlock`,
  create: () => t`Create`,
  lock: () => t`Lock`,
  deletedOn: (date: string) => t`Deleted on ${date}`,
  disabled: () => t`Disabled`,
  reminderRecurringMode: {
    day: () => t`Daily`,
    week: () => t`Weekly`,
    month: () => t`Monthly`,
    year: () => t`Yearly`
  },
  mergeConflict: {
    thisDevice: () => t`This device`,
    otherDevice: () => t`Incoming`
  },
  noteHistoryPlaceholder: () => t`No note history available for this device.`,
  noteHistoryNotice: {
    0: () => t`Note version history is local only.`,
    1: () => t`Learn how this works.`
  },
  encryptedNoteHistoryNotice: () =>
    t`Preview not available, content is encrypted.`,
  dateDescFromKey: (
    key:
      | "dateCreated"
      | "dateEdited"
      | "dateModified"
      | "dateUploaded"
      | "dateDeleted"
  ) =>
    select(key, {
      dateCreated: `Created at`,
      dateEdited: `Last edited at`,
      dateModified: `Last modified at`,
      dateUploaded: `Uploaded at`,
      dateDeleted: `Deleted at`,
      other: key
    }),
  noNotePropertiesNotice: () => t`Start writing to save your note.`,
  noteSyncedNoticeHeading: () => t`Encrypted and synced`,
  emptyPlaceholders: (type: "notebook" | "tag" | "note") =>
    select(type, {
      other: "This list is empty",
      notebook: "No notebooks",
      tag: "No tags",
      note: "No notes"
    }),
  untitledNote: () => strings.untitled(),
  newNote: () => t`New note`,
  exportingNotes: (status?: string) =>
    status ? status : t`Exporting notes`,
  exportingNotesDesc: () => t`Please wait while we export your notes.`,
  exportingNote: (title: string) => t`Exporting "${title}"`,
  exportingNoteDesc: () => t`Please wait while we export your not.`,
  exportSuccessHeading: (count: number) =>
    plural(count, {
      one: "Note exported",
      other: "# notes exported"
    }),
  exportSuccessDesc: (path: string) =>
    t`Notes exported as ${path} successfully`,
  issueNotice: {
    0: () => t`The information above will be publically available at`,
    1: () =>
      t`If you want to ask something in general or need some assistance, we would suggest that you`,
    2: () => t`join our community on Discord.`
  },
  linkNoteEmptyBlock: () => t`(empty block)`,
  linkNoteSelectedNote: () => t`SELECTED NOTE`,
  tapToDeselect: () => t`Tap to deselect`,
  clickToDeselect: () => t`Click to deselect`,
  linkNoteToSection: () => t`LINK TO A SECTION`,
  migrationProgress: (progress?: {
    total: number;
    collection: string;
    current: number;
  }) =>
    t`Migrating ${progress ? `${progress?.collection}` : ""} ${progress ? `(${progress.current}/${progress.total}) ` : ""
      }... please wait`,
  migrationError: () =>
    t`An error occurred while migrating your data. You can logout of your account and try to relogin. However this is not recommended as it may result in some data loss if your data was not synced.`,
  migrationAppReset: () =>
    t`App data has been cleared. Kindly relaunch the app to login again.`,
  migrationErrorNotice: () => [
    t`If this continues to happen, please reach out to us via`,
    t`or email us at`
  ],
  migrationFailed: () => t`Migration failed`,
  notebooks: () => t`Notebooks`,
  syncingHeading: () => t`Syncing your data`,
  syncingDesc: () => t`Please wait while we sync all your data.`,
  downloadingAttachments: () => t`Downloading attachments`,
  pleaseWait: () => t`Please wait`,
  publishedAt: () => t`Published at`,
  monographDesc: () => t`This note will be published to a public URL.`,
  openInBrowser: () => t`Open in browser`,
  monographPassHeading: () => t`Password protection`,
  monographPassDesc: () =>
    t`Published note can only be viewed by someone with the password.`,
  monographSelfDestructHeading: () => t`Self destruct`,
  monographSelfDestructDesc: () =>
    t`Published note link will be automatically deleted once it is viewed by someone.`,
  monographLearnMore: () => t`Learn more about Notesnook Monograph`,
  rateAppHeading: () => t`Do you enjoy using Notesnook?`,
  rateAppDesc: () =>
    t`It took us a year to bring Notesnook to life. Share your experience and suggestions to help us improve it.`,
  recoveryKeySavedConfirmation: () =>
    t`Tap twice to confirm you have saved the recovery key.`,
  noBlocksLinked: () => t`No blocks linked`,
  noReferencesFound: () => t`No references found of this note`,
  notReferenced: () => t`This note is not referenced in other notes.`,
  notLinked: () => t`This note is not linked to any other note.`,
  noLinksFound: () => t`No links found`,
  noBlocksOnNote: () => t`There are no blocks in this note.`,
  dataTypes: {
    note: () => t`note`,
    notebook: () => t`notebook`,
    tag: () => t`tag`,
    reminder: () => t`reminder`,
    color: () => t`color`,
    attachment: () => t`attachment`,
    item: () => t`item`,
    shortcut: () => t`shortcut`
  },
  dataTypesPlural: {
    note: () => t`notes`,
    notebook: () => t`notebooks`,
    tag: () => t`tags`,
    reminder: () => t`reminders`,
    color: () => t`colors`,
    attachment: () => t`attachments`,
    item: () => t`items`,
    shortcut: () => t`shortcuts`
  },
  dataTypesPluralCamelCase: {
    note: () => t`Notes`,
    notebook: () => t`Notebooks`,
    tag: () => t`Tags`,
    reminder: () => t`Reminders`,
    attachment: () => t`Attachments`,
    favorite: () => t`Favorites`,
    monograph: () => t`Monographs`
  },
  addItem: (itemType: "tag" | "notebook" | "reminder" | "note") =>
    select(itemType, {
      tag: `Add a tag`,
      notebook: `Add a notebook`,
      reminder: `Add a reminder`,
      note: `Add a note`,
      other: `Add an item`
    }),
  reminderRepeatStrings: {
    day: (date: string) => t`Repeats daily at ${date}`,
    week: {
      daily: (date: string) => t`The reminder will repeat daily at ${date}.`,
      selectDays: () => t`Select day of the week to repeat the reminder.`
    },
    year: (date: string) => t`The reminder will repeat every year on ${date}.`,
    month: {
      selectDays: () => t`Select nth day of the month to repeat the reminder.`
    },
    repeats: (
      freq: number,
      mode: string,
      selectedDays: string,
      date: string
    ) => {
      const strings = {
        day: plural(freq, {
          one: `Repeats every day on ${selectedDays} at ${date}`,
          other: `Repeats every # day every ${selectedDays} at ${date}`
        }),
        week: plural(freq, {
          one: `Repeats every week on ${selectedDays} at ${date}`,
          other: `Repeats every # week every ${selectedDays} at ${date}`
        }),
        month: plural(freq, {
          one: `Repeats every month on ${selectedDays} at ${date}`,
          other: `Repeats every # month every ${selectedDays} at ${date}`
        }),
        year: plural(freq, {
          one: `Repeats every year on ${selectedDays} at ${date}`,
          other: `Repeats every # year every ${selectedDays} at ${date}`
        })
      };
      return strings[mode as keyof typeof strings];
    }
  },
  remindMeIn: () => t`Remind me in`,
  referencedIn: () => t`Referenced in`,
  noBackupsFound: () => t`No backups found`,
  restoring: () => t`Restoring`,
  restoringCollection: (collection: string) => t`Restoring ${collection}...`,
  checkNewVersion: () => t`Checking for new version`,
  noUpdates: () => t`No updates available`,
  updateAvailable: () => t`Update available`,
  versionReleased: (version: string, type: "github" | "store") =>
    select(type, {
      github: `v${version} has been released on GitHub`,
      other: `v${version} has been released`
    }),
  readReleaseNotes: () => t`Read full release notes on Github`,
  settings: () => t`Settings`,
  notLoggedIn: () => t`Not logged in`,
  never: () => t`Never`,
  syncing: () => t`Syncing`,
  syncNow: () => t`Sync now`,
  syncFailed: () => t`Sync failed`,
  synced: () => t`Synced`,
  offline: () => t`Offline`,
  editorFailedToLoad: () =>
    t`If the editor fails to load even after reloading. Try restarting the app.`,
  gettingInformation: () => t`Getting information`,
  enterSixDigitCode: () => t`Enter 6 digit code`,
  gettingRecoveryCodes: () => t`Getting recovery codes`,
  loggingOut: () => t`Logging out. Please wait...`,
  loggingOutDesc: () => t`Please wait while we log you out.`,
  by: () => t`By`,
  noResultsForSearch: (query: string) => t`No results found for "${query}"`,
  results: (count: number) =>
    plural(count, {
      one: "1 result",
      other: `# results`
    }),
  noThemesFound: () => t`No themes found`,
  errorLoadingThemes: () => t`Error loading themes`,
  loadingThemes: () => t`Loading themes...`,
  version: () => t`Version`,
  visitHomePage: () => t`Visit homepage`,
  tapToApplyAgain: () => t`Tap to apply again`,
  titleFormattingGuide: () => t`Use the following key to format the title:

$date$: Current date.
$time$: Current time.
$timestamp$: Full date and time without any spaces or other symbols.
(e.g 202305261253).
$count$: Number of notes + 1.
$headline$: Use starting line of the note as title.
$day$: Current day (eg. Monday)`,
  setYourName: () => t`Set your name`,
  presets: () => t`PRESETS`,
  group: () => t`GROUP`,
  groupedAllTools: () => t`All tools are grouped`,
  collapsed: () => t`COLLAPSED`,
  releaseNotes: () => t`Release notes`,
  passTooShort: () => t`Atleast 8 characters required`,
  changePassword: () => t`Change password`,
  accountRecovery: () => t`Recover your account`,
  changeAppLockCredentials: (
    mode: "create" | "change" | "remove",
    keyboardType: string
  ) =>
    select(mode, {
      create: `Create app lock ${keyboardType}`,
      change: `Change app lock ${keyboardType}`,
      remove: `Remove app lock ${keyboardType}`,
      other: ""
    }),

  createVault: () => t`Create vault`,
  createVaultDesc: () => t`A vault stores your notes in an encrypted storage.`,
  changeVaultPassword: () => t`Change vault password`,
  deleteNote: () => doActions.delete.note(1),
  shareNote: () => t`Share note`,
  copyNote: () => t`Copy note`,
  goToEditor: () => t`Unlock note`,
  lockNote: () => t`Lock note`,
  applyChanges: () => t`Apply changes`,
  noteHistory: () => t`Note history`,
  selectNotebooks: () => t`Select notebooks`,
  selectNotebooksDesktopDesc: (keyboardShortcut: string) =>
    t`Use ${keyboardShortcut}+click to select multiple notebooks`,
  enableMultiSelect: () =>
    t`You can also link a note to multiple Notebooks. Tap and hold any notebook to enable multi-select.`,
  changeEmail: () => t`Change email address`,
  changeEmailDesc: () =>
    t`Your account email will be changed without affecting your subscription or any other settings.`,
  changeEmailNotice: () => t`You will be logged out from all your devices`,
  export: () => t`Export`,
  exportNotes: (notes: number) =>
    plural(notes, { one: "Export note", other: "Export # notes" }),
  issueTitle: () => t`Report issue`,
  issueDesc: () =>
    t`We are sorry, it seems that the app crashed due to an error. You can submit a bug report below so we can fix this asap.`,
  issueDesc2: () =>
    t`Let us know if you have faced any issue/bug while using Notesnook. We will try to fix it as soon as possible.`,
  migrationSaveBackup: () => t`Save a backup of your notes`,
  migrationSaveBackupDesc: () =>
    t`Thank you for updating Notesnook! We will be applying some minor changes for a better note taking experience.`,
  moveNotebook: (count: number, title: string) =>
    plural(count, {
      one: `Moving ${title}`,
      other: `Moving # notebooks`
    }),
  publish: () => t`Publish`,
  publishNote: () => t`Publish note`,
  publishNoteDesc: () =>
    t`Publish your note to share it with others. You can set a password to protect it.`,
  saveRecoveryKey: () => t`Save account recovery key`,
  saveRecoveryKeyDesc: () =>
    t`Save your account recovery key in a safe place. You will need it to recover your account in case you forget your password.`,
  backups: () => t`Backups`,
  twoFactorAuth: () => t`Two-factor authentication`,
  twoFactorAuthDesc: () =>
    t`Enable two-factor authentication to add an extra layer of security to your account.`,
  saveRecoveryCodes: () => t`Save recovery codes`,
  saveRecoveryCodesDesc: () =>
    t`Save your recovery codes in a safe place. You will need them to recover your account in case you lose access to your two-factor authentication methods.`,
  fallbackMethodEnabled: () => t`Fallback method for 2FA enabled`,
  accountIsSecure: () =>
    t`Your account is now 100% secure against unauthorized logins.`,
  twoFactorAuthEnabled: () => t`Two-factor authentication enabled`,
  listOf: () => t`List of`,
  network: {
    downloading: (progress?: string | number) =>
      progress ? t`Downloading (${progress})` : t`Downloading`,
    download: () => t`Download`,
    uploaded: () => t`Uploaded`,
    reupload: () => t`Reupload`,
    downloadSuccess: () => t`Download successful`,
    fileDownloaded: (name?: string) => t`${name || "File"} downloaded`,
    dowloadCancelled: () => t`Download cancelled`,
    cancelDownload: () => t`Cancel download`,
    cancelUpload: () => t`Cancel upload`
  },
  regenerate: () => t`Regenerate`,
  redo: () => t`Redo`,
  pinned: () => t`Pinned`,
  editNotebook: () => doActions.edit.notebook(1),
  newNotebook: () => t`New notebook`,
  newInternalLink: () => t`Link to note`,
  editInternalLink: () => t`Edit internal link`,
  newColor: () => t`New color`,
  tabs: () => t`Tabs`,
  add: () => t`Add`,
  newVersion: () => t`New version`,
  newVersionHighlights: (version?: string) =>
    t`${version ? `v${version} ` : "New version"} Highlights 🎉`,
  editReminder: () => doActions.edit.reminder(1),
  newReminder: () => t`New reminder`,
  sortBy: () => t`Sort by`,
  groupBy: () => t`Group by`,
  groupAndSort: () => t`Group & sort`,
  groupedBy: (group: string) => t`Grouped by ${group}`,
  switchToDetailedView: () => t`Switch to detailed view`,
  switchToCompactView: () => t`Switch to compact view`,
  toc: () => t`Table of contents`,
  appliedDark: () => t`Applied as dark theme`,
  appliedLight: () => t`Applied as light theme`,
  loginToYourAccount: () => t`Login to your account`,
  continue: () => t`Continue`,
  unlockWithBiometrics: () => t`Unlock with biometrics`,
  fileCheck: () => t`Run file check`,
  rename: () => t`Rename`,
  no: () => t`No`,
  yes: () => t`Yes`,
  cancel: () => t`Cancel`,
  changePasswordConfirm: () => t`I understand, change my password`,
  next: () => t`Next`,
  forgotPassword: () => t`Forgot password?`,
  cancelLogin: () => t`Cancel login`,
  logoutFromDevice: () => t`Logout from this device`,
  useAccountPassword: () => t`Use account password`,
  addColor: () => t`Add color`,
  unlockNote: () => t`Unlock note`,
  couldNotUnlock: () => t`Could not unlock`,
  unlockNoteDesc: () =>
    t`Your note will be unencrypted and removed from the vault.`,
  deleteAllNotes: () => t`Delete notes in this vault permanently`,
  getStarted: () => t`Get started`,
  saveACopy: () => t`Save a copy`,
  discard: () => t`Discard`,
  undo: () => t`Undo`,
  keep: () => t`Keep`,
  restore: () => t`Restore`,
  deletePermanently: () => t`Delete permanently`,
  viewAllLinkedNotebooks: () => t`View all linked notebooks`,
  learnMore: () => t`Learn more`,
  addTag: () => t`Add tag`,
  addTagDesc: () => t`Create a tag to group related notes together.`,
  save: () => t`Save`,
  verify: () => t`Verify`,
  newTab: () => t`New tab`,
  openFileLocation: () => t`Open file location`,
  exportAgain: () => t`Export again`,
  submit: () => t`Submit`,
  createLink: () => t`Create link`,
  logoutAndClearData: () => t`Logout and clear data`,
  saveAndContinue: () => t`Save and continue`,
  moveToTop: () => t`Move to top`,
  gotIt: () => t`Got it`,
  unpublish: () => t`Unpublish`,
  update: () => t`Update`,
  rateApp: () => t`Rate now (It takes only a second)`,
  later: () => t`Later`,
  copyToClipboard: () => t`Copy to clipboard`,
  saveQRCode: () => t`Save QR code to gallery`,
  saveAsText: () => t`Save to text file`,
  shareToCloud: () => t`Share to cloud`,
  linkedNotes: () => t`Linked notes`,
  noLinkedNotes: () => t`No linked notes`,
  reminderModes: (mode: string) =>
    select(mode, {
      repeat: "Repeat",
      once: "Once",
      permanent: "Permanent",
      other: "Unknown mode"
    }),
  recurringModes: (mode: string) =>
    select(mode, {
      day: "Daily",
      week: "Weekly",
      month: "Monthly",
      year: "Yearly",
      other: "Unknown mode"
    }),
  weekDayNames: {
    0: () => t`Sunday`,
    1: () => t`Monday`,
    2: () => t`Tuesday`,
    3: () => t`Wednesday`,
    4: () => t`Thursday`,
    5: () => t`Friday`,
    6: () => t`Saturday`
  },
  weekDayNamesShort: {
    0: () => t`Sun`,
    1: () => t`Mon`,
    2: () => t`Tue`,
    3: () => t`Wed`,
    4: () => t`Thu`,
    5: () => t`Fri`,
    6: () => t`Sat`
  },
  selectDate: () => t`Select date`,
  reminderNotificationModes: (
    mode: keyof typeof REMINDER_NOTIFICATION_MODES | ({} & string)
  ) => {
    return mode in REMINDER_NOTIFICATION_MODES
      ? REMINDER_NOTIFICATION_MODES[
        mode as keyof typeof REMINDER_NOTIFICATION_MODES
      ]()
      : mode;
  },
  oldNew: () => t`Old - new`,
  newOld: () => t`New - old`,
  latestFirst: () => t`Latest first`,
  earliestFirst: () => t`Earliest first`,
  mostRelevantFirst: () => t`Most relevant first`,
  leastRelevantFirst: () => t`Least relevant first`,
  aToZ: () => t`A to Z`,
  zToA: () => t`Z to A`,
  title: () => t`Title`,
  sortByStrings: {
    dateModified: () => t`Date modified`,
    dateEdited: () => t`Date edited`,
    dateCreated: () => t`Date created`,
    title: () => t`Title`,
    dueDate: () => t`Due date`,
    dateDeleted: () => t`Date deleted`,
    relevance: () => t`Relevance`
  },
  groupByStrings: {
    default: () => t`Default`,
    none: () => t`None`,
    abc: () => t`Abc`,
    year: () => t`Year`,
    week: () => t`Week`,
    month: () => t`Month`
  },
  downloadUpdate: () => t`Download update`,
  removeShortcut: () => doActions.remove.shortcut(1),
  createShortcut: () => t`Create a shortcut`,
  tip: () => t`TIP`,
  neverShowAgain: () => t`Never show again`,
  skipIntroduction: () => t`Skip introduction`,
  reloadEditor: () => t`Taking too long? Reload editor`,
  copy: () => t`Copy`,
  resendCode: (seconds?: number) =>
    t`Resend code${seconds ? ` in ${seconds}` : ""}`,
  change2faMethod: () => t`Change 2FA method`,
  copyCodes: () => t`Copy codes`,
  saveToFile: () => t`Save to file`,
  secondary2faMethod: () => t`Setup secondary 2FA method`,
  confirmEmail: () => t`Confirm email`,
  confirmEmailDesc: () =>
    t`Check your spam folder if you haven't received an email yet.`,
  subscriptionProviderInfo: {
    0: {
      title: () => t`Subscription awarded from Streetwriters`,
      desc: () =>
        t`You were awarded a subscription to Notesnook Pro by Streetwriters.`
    },
    1: {
      title: () => t`Subscribed on iOS`,
      desc: () =>
        t`You subscribed to Notesnook Pro on iOS using Apple In App Purchase. You can cancel anytime with your iTunes Account settings.`
    },
    2: {
      title: () => t`Subscribed on Android`,
      desc: () =>
        t`You subscribed to Notesnook Pro on Android Phone/Tablet using Google In App Purchase.`
    },
    3: {
      title: () => t`Subscribed on Web`,
      desc: () => t`You subscribed to Notesnook Pro on the Web/Desktop App.`
    },
    4: {
      title: () => t`Subscribed using gift card`,
      desc: () => t`You subscribed to Notesnook Pro using a gift card.`
    }
  },
  dark: () => t`Dark`,
  light: () => t`Light`,
  all: () => t`All`,
  loadFromFile: () => t`Load from file`,
  setAsDarkTheme: () => t`Set as dark theme`,
  setAsLightTheme: () => t`Set as light theme`,
  defaultDarkThemeDesc: () => t`The default dark theme for the Notesnook app`,
  defaultLightThemeDesc: () => t`The default light theme for Notesnook app.`,
  source: () => t`Source`,
  createAGroup: () => t`Create a group`,
  fileCheckFailed: (reason: string) =>
    t`File check failed: ${reason} Try reuploading the file to fix the issue.`,
  changePasswordNotice: () =>
    t`Changing password is an irreversible process. You will be logged out from all your devices. Please make sure you do not close the app while your password is changing and have good internet connection.`,
  changePasswordNotice2: () =>
    t`Once your password is changed, please make sure to save the new account recovery key`,
  debugNotice: () =>
    t`All logs are local only and are not sent to any server. You can share the logs from here with us if you face an issue to help us find the root cause.`,
  configureToolbarNotice: () =>
    t`Curate the toolbar that fits your needs and matches your personality.`,
  fileSaved: (name: string, platform: string) =>
    select(platform, {
      android: `${name} saved to selected path`,
      other: `${name} saved to File Manager/Notesnook/downloads`
    }),
  downloadError: (message: string) => t`Error downloading file: ${message}`,
  invalid: (type: string) => t`Invalid ${type}`,
  upgradeToPro: () => t`Upgrade to Pro`,
  fileCheckPassed: () => t`File check passed`,
  renameFile: () => t`Rename file`,
  hashCopied: () => t`Hash copied`,
  mediaTypes: {
    all: () => t`All files`,
    image: () => t`Images`,
    video: () => t`Videos`,
    document: () => t`Documents`,
    orphaned: () => t`Orphaned`,
    errors: () => t`Errors`,
    audio: () => t`Audios`
  },
  orphaned: () => t`Orphaned`,
  uploads: () => t`Uploads`,
  emailNotConfirmed: () => t`Email not confirmed`,
  emailNotConfirmedDesc: () =>
    t`Your email is not confirmed. Please confirm your email address to change account password.`,
  allFieldsRequired: () => t`All fields are required`,
  backupFailed: () => t`Could not create backup`,
  passwordChangedSuccessfully: () => t`Password changed successfully`,
  emailRequired: () => t`Email is required`,
  logoutDesc: () =>
    t`Are you sure you want to logout from this device? Any unsynced changes will be lost.`,
  logout: () => t`Logout`,
  loginSuccess: () => t`Login successful`,
  loginSuccessDesc: (email: string) => t`Welcome back, ${email}`,
  applockDisabled: () => t`App lock disabled`,
  remove: () => t`Remove`,
  passwordIncorrect: () => t`Password incorrect`,
  incorrect: (type: string) => t`Incorrect ${type}`,
  mismatch: (type: string) => t`${type} does not match`,
  noColorSelected: () => t`No color selected`,
  colorExists: (color: string) => t`Color #${color} already exists`,
  pdfLocked: () => t`PDF is password protected`,
  pdfLockedDesc: () =>
    t`Please enter the password to unlock the PDF and view the content.`,
  enterPassword: () => t`Enter password`,
  failedToDownloadFile: () => t`Failed to download file`,
  savingZipFile: (progress?: string) =>
    progress
      ? t`Saving zip file (${progress}%). Please wait...`
      : t`Saving zip file. Please wait...`,
  fileVerificationFailed: () => t`Uploaded file verification failed.`,
  fileLengthError: () =>
    t`File length is 0. Please upload this file again from the attachment manager.`,
  fileLengthMismatch: (expectedSize: number, currentSize: number) =>
    t`File length mismatch. Expected ${expectedSize} but got ${currentSize} bytes. Please upload this file again from the attachment manager.`,
  failedToResolvedDownloadUrl: () => t`Failed to resolve download url`,
  fileSize: () => t`File size`,
  passwordNotEntered: () => t`Password not entered`,
  passwordNotMatched: () => t`Password does not match`,
  passwordUpdated: () => t`Password updated`,
  noteLocked: () => t`Note locked`,
  biometricUnlockEnabled: () => t`Biometric unlocking enabled`,
  biometricUnlockDisabled: () => t`Biometric unlocking disabled`,
  vaultCreated: () => t`Vault created`,
  noteUnlocked: () => t`Note unlocked`,
  noteCopied: () => t`Note copied to clipboard`,
  introData: [
    {
      headings: [
        () => t`Open source.`,
        () => t`End to end encrypted.`,
        () => t`Private.`
      ],
      body: () => t`Write notes with freedom, no spying, no tracking.`
    },
    {
      headings: [
        () => t`Privacy for everyone`,
        () => t`— not just the`,
        () => t`privileged few`
      ],
      body: () =>
        t`Your privacy matters to us, no matter who you are. In a world where everyone is trying to spy on you, Notesnook encrypts all your data before it leaves your device. With Notesnook no one can ever sell your data again.`
    },
    {
      tesimonial: () =>
        t`You simply cannot get any better of a note taking app than @notesnook. The UI is clean and slick, it is feature rich, encrypted, reasonably priced (esp. for students & educators) & open source`,
      link: "https://twitter.com/andrewsayer/status/1637817220113002503",
      user: () => t`@andrewsayer on Twitter`
    }
  ],
  shortcutCreated: () => actions.created.shortcut(1),
  notebookRestored: () => actions.restored.notebook(1),
  restoreNotebook: () => doActions.restore.notebook(1),
  permanentlyDeletedNotebook: () => actions.permanentlyDeleted.notebook(1),
  noteRestoredFromHistory: () => t`Note restored from history`,
  noteRestored: () => actions.restored.note(1),
  deleteNoteConfirmation: () => actionConfirmations.permanentlyDelete.note(1),
  noteDeleted: () => actions.deleted.note(1),
  restored: () => t`Restored successfully`,
  manageTags: () => t`Manage tags`,
  move: () => t`Move`,
  unlinkNotebook: () => t`Unlink notebook`,
  unfavorite: () => t`Unfavorite`,
  moveToTrash: () => t`Move to trash`,
  enterNotebookTitle: () => t`Enter notebook title`,
  emailUpdated: (email: string) => t`Email updated to ${email}`,
  noApplicationFound: (fileToOpen: string) =>
    t`No application found to open ${fileToOpen}`,
  moveNotebooks: (count: number) =>
    plural(count, { one: "Move notebook", other: `Move # notebooks` }),
  moveNotebooksConfirm: (count: number, selectedNotebookTitle: string) =>
    plural(count, {
      one: `Are you sure you want to move this notebook to ${selectedNotebookTitle}?`,
      other: `Are you sure you want to move these # notebooks ${selectedNotebookTitle}?`
    }),
  failedToPublish: () => t`Failed to publish note`,
  failedToUnpublish: () => t`Failed to unpublish note`,
  notePublished: () => actions.published.note(1),
  monographUrlCopied: () => t`Monograph URL copied`,
  recoveryKeySaved: () => t`Did you save recovery key?`,
  recoveryKeySavedDesc: () =>
    t`Please make sure you have saved the recovery key. Tap one more time to confirm.`,
  recoveryKeyQRCodeSaved: () => t`Recovery key QR code saved`,
  recoveryKeyTextFileSaved: () => t`Recovery key text file saved`,
  recoveryKeyCopied: () => t`Recovery key copied`,
  timeShort: {
    minute: () => t`min`,
    hour: () => t`hr`
  },
  backupEncrypted: () => t`Backup is encrypted`,
  password: () => t`Password`,
  renameTag: () => doActions.rename.tag(1),
  renameColor: () => doActions.rename.color(1),
  renameColorDesc: (color: string) => t`You are renaming color ${color}`,
  name: () => t`Name`,
  unlockToDelete: () => t`Unlock note to delete it`,
  backupRestored: () => t`Backup restored`,
  restoreFailed: () => t`Restore failed`,
  reorder: () => t`Reorder`,
  turnOffReminder: () => t`Turn off reminder`,
  turnOnReminder: () => t`Turn on reminder`,
  addShortcut: () => t`Add shortcut`,
  addNotebook: () => t`Add notebook`,
  removeAsDefault: () => t`Remove as default`,
  setAsDefault: () => t`Set as default`,
  unpin: () => t`Unpin`,
  pin: () => t`Pin`,
  lockedNotesPinnedFailed: () => t`Locked notes cannot be pinned`,
  loginRequired: () => t`Login required`,
  confirmEmailToPublish: () => t`Confirm email to publish note`,
  lockedNotesPublishFailed: () => t`Locked notes cannot be published`,
  removeFromNotebook: () => t`Remove from notebook`,
  attachments: () => t`Attachments`,
  attachedFiles: () => t`Attached files`,
  history: () => t`History`,
  copyLink: () => t`Copy link`,
  linkCopied: () => t`Link copied`,
  copyId: () => t`Copy ID`,
  idCopied: () => t`ID copied`,
  readOnly: () => t`Read only`,
  syncOff: () => t`Sync off`,
  syncOffConfirm: (count: number) =>
    plural(count, {
      one: `Prevent note from syncing`,
      other: `Prevent # notes from syncing`
    }),
  syncOffDesc: (count: number) =>
    plural(count, {
      one: `Note will be automatically deleted from all other devices & any future changes won't get synced. Are you sure you want to continue?`,
      other: `# notes will be automatically deleted from all other devices & any future changes won't get synced. Are you sure you want to continue?`
    }),
  duplicate: () => t`Duplicate`,
  remindMe: () => t`Remind me`,
  published: () => t`Published`,
  unpinFromNotifications: () => t`Unpin notification`,
  pinToNotifications: () => t`Pin notification`,
  linkNotebooks: () => t`Link notebooks`,
  unlinkFromAll: () => t`Unlink from all`,
  removeFromAll: () => t`Remove from all`,
  assignTo: () => t`Assign to...`,
  addTags: () => t`Add tags`,
  addTagsDesc: () => t`Add tags to multiple notes at once`,
  references: () => t`References`,
  moveNotebookFix: () => t`Move notebook`,
  failedToSubscribe: () => t`Failed to subscribe`,
  createNewNote: () => t`Create a new note`,
  monographs: () => t`Monographs`,
  fileTooLarge: () => t`File too big`,
  failToOpen: () => t`Failed to open`,
  fileMismatch: () => t`File mismatch`,
  noNoteProperties: () => t`Start writing to create a new note`,
  createNoteFirst: () => t`Create a note first`,
  noteLockedSave: () => t`This note is locked. Unlock note to save changes`,
  saveFailedVaultLocked: () => t`Save failed. Vault is locked`,
  yourFavorites: () => t`Your favorites`,
  yourNotes: () => t`Your notes`,
  yourReminders: () => t`Your reminders`,
  yourMonographs: () => t`Your monographs`,
  yourArchive: () => t`Your archive`,
  favoritesEmpty: () => t`You have not favorited any notes yet`,
  notesEmpty: () => t`You have not created any notes yet`,
  tagsEmpty: () => t`You have not added any tags yet`,
  notebooksEmpty: () => t`You have not added any notebooks yet`,
  remindersEmpty: () => t`You have not set any reminders yet`,
  monographsEmpty: () => t`You have not published any monographs yet`,
  loadingFavorites: () => t`Loading your favorites`,
  loadingNotes: () => t`Loading your notes`,
  loadingReminders: () => t`Loading your reminders`,
  loadingMonographs: () => t`Loading your monographs`,
  loadingArchive: () => t`Loading your archive`,
  addFirstNote: () => t`Add your first note`,
  setReminder: () => t`Set a reminder`,
  learnMoreMonographs: () => t`Learn more about Monographs`,
  mfaAuthAppTitle: () => t`Setup using an Authenticator app`,
  mfaAuthAppDesc: () => t`Use an authenticator app to generate 2FA codes.`,
  mfaAuthAppSubtitle: () =>
    t`Please confirm your identity by entering the authentication code from your authenticator app.`,
  mfaAuthAppInstructions: () =>
    t`Open the two-factor authentication (TOTP) app to view your authentication code.`,
  mfaAuthAppSelector: () => t`Don't have access to your authenticator app?`,
  mfaEmailTitle: () => t`Setup using email`,
  mfaEmailDesc: () =>
    t`Notesnook will send you a 2FA code on your email when prompted`,
  mfaEmailSubtitle: () =>
    t`Please confirm your identity by entering the authentication code sent to your email address.`,
  mfaEmailInstructions: () => t`It may take a minute to receive your code.`,
  mfaEmailSelector: () => t`Don't have access to your email address?`,
  mfaSmsTitle: () => t`Setup using SMS`,
  mfaSmsDesc: () =>
    t`Notesnook will send you an SMS with a 2FA code when prompted`,
  mfaSmsSubtitle: (phoneNumber?: string) =>
    t`Please confirm your identity by entering the authentication code sent to ${phoneNumber ? phoneNumber : "your registered phone number."
      }.`,
  mfaSmsInstructions: () => t`It may take a minute to receive your code.`,
  mfaSmsSelector: () => t`Don't have access to your phone number?`,
  mfaRecoveryCodeSubtitle: () =>
    t`Please confirm your identity by entering a recovery code.`,
  mfaRecoveryCodeSelector: () => t`Don't have your recovery codes?`,
  enterRecoveryCode: () => t`Enter recovery code`,
  codesCopied: () => t`Recovery codes copied!`,
  resendCodeWait: () => t`Please wait before requesting a new code`,
  phoneNumberNotEntered: () => t`Phone number not entered`,
  "2faCodeSentVia": (method: string) => t`2FA code sent via ${method}`,
  codesSaved: () => t`Recovery codes saved!`,
  logsCopied: () => t`Debug log copied!`,
  logsDownloaded: () => t`Debug logs downloaded`,
  clearLogs: () => t`Clear logs`,
  clear: () => t`Clear`,
  clearLogsConfirmation: (key: string) =>
    t`Are you sure you want to clear all logs from ${key}?`,
  enterPasswordDesc: () => t`Please enter your password to continue`,
  verifyFailed: () => t`User verification failed`,
  enterApplockPassword: () => t`Enter app lock password`,
  enterApplockPasswordDesc: () =>
    t`Please enter your app lock password to continue`,
  enterApplockPin: () => t`Enter app lock pin`,
  enterApplockPinDesc: () => t`Please enter your app lock pin to continue`,
  account: () => t`Account`,
  subDetails: () => t`Subscription details`,
  subEnded: () => t`Your subscription has ended`,
  accountDowngradedIn: (days: number) =>
    t`Your account will be downgraded in ${days} days`,
  subEndsOn: (date: string) => t`Your subscription ends on ${date}`,
  subRenewOn: (date: string) => t`Your subscription renews on ${date}`,
  neverHesitate: () => t`Never hesitate to choose privacy`,
  manageAccount: () => t`Manage account`,
  manageAccountDesc: () => t`Manage your account related settings here`,
  removeProfilePicture: () => t`Remove profile picture`,
  removeProfilePictureDesc: () => t`Remove your profile picture`,
  removeProfilePictureConfirmation: () =>
    t`Are you sure you want to remove your profile picture?`,
  removeFullName: () => t`Remove full name`,
  removeFullNameConfirmation: () =>
    t`Are you sure you want to remove your name?`,
  removeFullNameDesc: () => t`Remove your full name from profile`,
  saveDataRecoveryKey: () => t`Save data recovery key`,
  saveDataRecoveryKeyDesc: () =>
    t`Save your data recovery key in a safe place. You will need it to recover your data in case you forget your password.`,
  manageAttachments: () => t`Manage attachments`,
  manageAttachmentsDesc: () => t`Manage your attachments in one place`,
  changePasswordDesc: () => t`Change your account password`,
  change2faMethodDesc: () =>
    t`Change your primary two-factor authentication method`,
  addFallback2faMethod: () => t`Add 2FA fallback method`,
  addFallback2faMethodDesc: () =>
    t`You can use fallback 2FA method incase you are unable to login via primary method`,
  change2faFallbackMethod: () => t`Change 2FA fallback method`,
  viewRecoveryCodes: () => t`View recovery codes`,
  viewRecoveryCodesDesc: () =>
    t`View your recovery codes to recover your account in case you lose access to your two-factor authentication methods.`,
  subscriptionNotActivated: () => t`Subscription not activated?`,
  loadingSubscription: () => t`Loading subscription details`,
  loadingSubscriptionDesc: () => t`Please wait while we load your subscription`,
  notesnookPro: () => t`Notesnook Pro`,
  subscribedOnVerify: (date: string) =>
    t`You subscribed to Notesnook Pro on ${date}. Verify this subscription?`,
  verifySubscription: () => t`Verify subscription`,
  subscriptionVerifyWait: () =>
    t`Please wait while we verify your subscription`,
  verifySubDesc: () => t`Verify your subscription to Notesnook Pro`,
  logoutWarnin: () =>
    t`Logging out will clear all data stored on THIS DEVICE. Make sure you have synced all your changes before logging out.`,
  logoutError: () => t`Error logging out`,
  deleteAccount: () => t`Delete account`,
  deleteAccountDesc: () =>
    t`Your account will be permanently deleted along with all your data, login credentials, and subscription information. This action is IRREVERSIBLE. Make sure you have saved a backup of your notes before proceeding.`,
  enterAccountPassword: () => t`Enter account password`,
  enterAccountPasswordDesc: () => t`Enter account password to proceed.`,
  failedToDeleteAccount: () => t`Failed to delete account`,
  syncSettings: () => t`Sync settings`,
  syncSettingsDesc: () => t`Manage your sync settings here`,
  disableAutoSync: () => t`Disable auto sync`,
  disableAutoSyncDesc: () =>
    t`Turn off automatic syncing. Changes from this client will be synced only when you run sync manually.`,
  disableRealtimeSync: () => t`Disable realtime sync`,
  disableRealtimeSyncDesc: () =>
    t`Changes from other devices won't be updated in the editor in real-time.`,
  disableSync: () => t`Disable sync`,
  disableSyncDesc: () =>
    t`Turns off syncing completely on this device. Any changes made will remain local only and new changes from your other devices won't sync to this device.`,
  backgroundSync: () => t`Background sync (experimental)`,
  backgroundSyncDesc: () =>
    t`Sync your notes in the background even when the app is closed. This is an experimental feature. If you face any issues, please turn it off.`,
  forcePullChanges: () => t`Force pull changes`,
  forcePullChangesDesc: () =>
    [
      t`Use this if changes from other devices are not appearing on this device. This will overwrite the data on this device with the latest data from the server.`,
      "",
      t`This must only be used for troubleshooting. Using it regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`
    ].join("\n"),
  forceSyncNotice: () =>
    t`This must only be used for troubleshooting. Using this regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`,
  forcePushChanges: () => t`Force push changes`,
  forcePushChangesDesc: () =>
    [
      t`Use this if changes made on this device are not appearing on other devices. This will overwrite the data on the server with the data from this device.`,
      "",
      t`This must only be used for troubleshooting. Using it regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`
    ].join("\n"),
  start: () => t`Start`,
  customization: () => t`Customization`,
  appearance: () => t`Appearance`,
  appearanceDesc: () =>
    t`Customize the appearance of the app with custom themes`,
  themes: () => t`Themes`,
  themesDesc: () => t`Choose from pre-built themes or create your own`,
  useSystemTheme: () => t`Use system theme`,
  useSystemThemeDesc: () =>
    t`Automatically switch between light and dark themes based on your system settings`,
  darkMode: () => t`Dark mode`,
  darkModeDesc: () => t`Use dark mode for the app`,
  behavior: () => t`Behavior`,
  behaviorDesc: () => t`Change how the app behaves in different situations`,
  imageCompression: () => t`Image Compression`,
  imageCompressionDesc: () => t`Compress images before uploading`,
  askEveryTime: () => t`Ask every time`,
  enableRecommended: () => t`Enable (Recommended)`,
  dateFormat: () => t`Date format`,
  dateFormatDesc: () => t`Choose how dates are displayed in the app`,
  timeFormat: () => t`Time format`,
  timeFormatDesc: () => t`Choose how time is displayed in the app`,
  "12-hour": () => t`12-hour`,
  "24-hour": () => t`24-hour`,
  clearTrashInterval: () => t`Clear trash interval`,
  clearTrashIntervalDesc: () =>
    t`Automatically clear trash after a certain period of time`,
  clearDefaultNotebook: () => t`Clear default notebook`,
  clearDefaultNotebookDesc: () => t`Newly created notes will be uncategorized`,
  defaultNotebookCleared: () => t`Default notebook cleared`,
  editor: () => t`Editor`,
  editorDesc: () => t`Customize the note editor`,
  customizeToolbar: () => t`Customize toolbar`,
  customizeToolbarDesc: () => t`Customize the toolbar in the note editor`,
  resetToolbar: () => t`Reset toolbar`,
  resetToolbarDesc: () => t`Reset the toolbar to default settings`,
  toolbarReset: () => t`Toolbar reset to default preset`,
  doubleSpacedLines: () => t`Double spaced lines`,
  doubleSpacedLinesDesc: () =>
    t`New lines will be double spaced (old ones won't be affected).`,
  lineSpacingChanged: () => t`Line spacing changed`,
  defaultFontSize: () => t`Default font size`,
  defaultFontSizeDesc: () => t`Default font size in editor`,
  defaultFontFamily: () => t`Default font family`,
  defaultFontFamilyDesc: () => t`Default font family in editor`,
  titleFormat: () => t`Title format`,
  titleFormatDesc: () => t`Choose how the new note titles are formatted`,
  mardownShortcuts: () => t`Markdown shortcuts`,
  mardownShortcutsDesc: () => t`Use markdown shortcuts in the editor`,
  privacyAndSecurity: () => t`Privacy & security`,
  marketingEmails: () => t`Marketing emails`,
  marketingEmailsDesc: () =>
    t`We will send you occasional promotional offers & product updates on your email (sent once every month).`,
  corsBypass: () => t`CORS bypass`,
  corsBypassDesc: () =>
    t`You can set a custom proxy URL to increase your privacy.`,
  vault: () => t`Vault`,
  vaultDesc: () => t`Multi-layer encryption to most important notes`,
  changeVaultPasswordDesc: () =>
    t`All locked notes will be re-encrypted with the new password.`,
  clearVaultDesc: () => t`Remove all notes from the vault.`,
  deleteVaultDesc: () => t`Delete vault (and optionally remove all notes).`,
  biometricUnlock: () => t`Biometric unlocking`,
  biometricUnlockDesc: () => t`Unlock your vault with biometric authentication`,
  revokeBiometricUnlock: () => t`Revoke biometric unlocking`,
  privacyMode: () => t`Privacy mode`,
  privacyModeDesc: () =>
    t`Hide app contents when you switch to other apps. This will also disable screenshot taking in the app.`,
  appLock: () => t`App lock`,
  appLockDesc: () => t`Lock the app with a password or pin`,
  enableAppLock: () => t`Enable app lock`,
  biometricsNotEnrolled: () => t`Biometrics not enrolled`,
  biometricsNotEnrolledDesc: () =>
    t`To use app lock, you must enable biometrics such as Fingerprint lock or Face ID on your phone.`,
  appLockTimeout: () => t`App lock timeout`,
  appLockTimeoutDesc: () =>
    t`Automatically lock the app after a certain period`,

  setupAppLockPin: () => t`Setup app lock pin`,
  setupAppLockPinDesc: () => t`Setup a pin to lock the app`,
  setupAppLockPassword: () => t`Setup app lock password`,
  setupAppLockPasswordDesc: () => t`Setup a password to lock the app`,
  changeAppLockPin: () => t`Change app lock pin`,
  changeAppLockPassword: () => t`Change app lock password`,
  changeAppLockPinDesc: () => t`Setup a new password for app lock`,
  changeAppLockPasswordDesc: () => t`Setup a new password for app lock`,
  removeAppLockPin: () => t`Remove app lock pin`,
  removeAppLockPassword: () => t`Remove app lock password`,
  removeAppLockPinDesc: () =>
    t`Remove app lock pin, app lock will be disabled if no other security method is enabled.`,
  removeAppLockPasswordDesc: () =>
    t`Remove app lock password, app lock will be disabled if no other security method is enabled.`,
  unlockWithBiometricsDesc: () =>
    t`Unlock the app with biometric authentication. This requires biometrics to be enabled on your device.`,
  appLockDisabled: () => t`App lock disabled`,
  backupRestore: () => t`Backup & restore`,
  backupsDesc: () => t`Manage your backups and restore data`,
  backupNow: () => t`Backup now`,
  backupNowWithAttachments: () => t`Backup now with attachments`,
  backupNowWithAttachmentsDesc: () =>
    t`Take a full backup of your data with all attachments`,
  backupNowDesc: () =>
    t`Take a partial backup of your data that does not include attachments`,
  automaticBackups: () => t`Automatic backups`,
  automaticBackupsDesc: () =>
    t`Set the interval to create a partial backup (without attachments) automatically.`,
  automaticBackupsWithAttachments: () => t`Automatic backups with attachments`,
  automaticBackupsWithAttachmentsDesc: () => [
    t`Set the interval to create a backup (with attachments) automatically.`,
    t`NOTE: Creating a backup with attachments can take a while, and also fail completely. The app will try to resume/restart the backup in case of interruptions.`
  ],
  selectBackupDir: () => t`Select backup directory`,
  selectBackupDirDesc: (path: string) => [
    t`Choose where to save your backups`,
    t`Current path: ${path}`
  ],
  noDirectorySelected: () => t`No directory selected`,
  changeBackupDir: () => t`Change backup directory`,
  backupEncryption: () => t`Backup encryption`,
  backupEncryptionDesc: () => t`Encrypt your backups for added security`,
  restoreBackup: () => t`Restore backup`,
  restoreBackupDesc: () => t`Restore your data from a backup`,
  exportAllNotes: () => t`Export all notes`,
  exportAllNotesDesc: () =>
    t`Export all notes as pdf, markdown, html or text in a single zip file`,
  productivity: () => t`Productivity`,
  quickNoteNotification: () => t`Quick note notification`,
  quickNoteNotificationDesc: () =>
    t`Quickly create a note from the notification`,
  reminders: () => t`Reminders`,
  remindersDesc: () => t`Manage your reminders`,
  reminderNotification: () => t`Reminder notifications`,
  reminderNotificationDesc: () =>
    t`Controls whether this device should receive reminder notifications.`,
  defaultSnoozeTime: () => t`Default snooze time`,
  defaultSnoozeTimeDesc: () =>
    t`Set the default time to snooze a reminder to when you press the snooze button on a notification.`,
  setSnoozeTimePlaceholder: () => t`Set snooze time in minutes`,
  changeNotificationSound: () => t`Change notification sound`,
  changeNotificationSoundDesc: () =>
    t`Change the sound that plays when you receive a notification`,
  helpAndSupport: () => t`Help and support`,
  reportAnIssue: () => t`Report an issue`,
  reportAnIssueDesc: () =>
    t`Faced an issue or have a suggestion? Click here to create a bug report`,
  emailSupport: () => t`Email support`,
  emailSupportDesc: () =>
    t`Contact us directly via support@streetwriters.co for any help or support`,
  documentation: () => t`Documentation`,
  documentationDesc: () =>
    t`Read the documentation to learn more about Notesnook`,
  debugging: () => t`Debugging`,
  debuggingDesc: () =>
    t`Get helpful debug info about the app to help us find bugs.`,
  debugLogs: () => t`Debug logs`,
  debugLogsDesc: () => t`View and share debug logs`,
  community: () => t`Community`,
  joinTelegram: () => t`Join our Telegram group`,
  joinTelegramDesc: () =>
    t`Join our Telegram group to chat with other users and the team`,
  joinMastodon: () => t`Follow us on Mastodon`,
  joinMastodonDesc: () =>
    t`Follow us on Mastodon for updates and news about Notesnook`,
  followOnX: () => t`Follow us on X`,
  followOnXDesc: () => t`Follow us on X for updates and news about Notesnook`,
  joinDiscord: () => t`Join our Discord server`,
  joinDiscordDesc: () =>
    t`Join our Discord server to chat with other users and the team`,
  tos: () => t`Terms of service`,
  tosDesc: () => t`Read the terms of service`,
  privacyPolicy: () => t`Privacy policy`,
  privacyPolicyDesc: () => t`Read the privacy policy`,
  licenses: () => t`Open source licenses`,
  ossLibs: () => t`Open source libraries used in Notesnook`,
  about: () => t`About`,
  downloadOnDesktop: () => t`Download on desktop`,
  downloadOnDesktopDesc: () =>
    t`Get Notesnook app on your desktop and access all notes`,
  roadmap: () => t`Roadmap`,
  roadmapDesc: () => t`See what the future of Notesnook is going to be like.`,
  checkForUpdates: () => t`Check for updates`,
  checkForUpdatesDesc: () => t`Check for new version of Notesnook`,
  autoUpdateCheck: () => t`Check for updates automatically`,
  autoUpdateCheckDesc: () =>
    t`Check for new version of the app available on app launch`,
  appVersion: () => t`App version`,
  platform: () => t`Platform`,
  phoneModel: () => t`Phone model`,
  model: () => t`Model`,
  defaultSound: () => t`Default sound`,
  editProfilePicture: () => t`Edit profile picture`,
  editProfilePictureDesc: () =>
    t`Your profile pictrure is stored 100% end-to-end encrypted and only visible to you.`,
  setFullName: () => t`Set full name`,
  setFullNameDesc: () =>
    t`Your name is stored 100% end-to-end encrypted and only visible to you.`,
  enterFullName: () => t`Enter full name`,
  deleteGroup: () => t`Delete group`,
  deleteGroupDesc: () =>
    t`All tools in this group will be removed from the toolbar.`,
  homePageChangedTo: (name: string) => t`Homepage changed to ${name}`,
  restartAppToApplyChanges: () => t`Restart the app to apply the changes`,
  deleteCollapsed: () => t`Delete collapsed section`,
  deleteCollapsedDesc: () =>
    t`All tools in the collapsed section will be removed`,
  clearTrash: () => t`Clear trash`,
  areYouSure: () => t`Are you sure?`,
  clearTrashConfirm: () => t`Are you sure you want to clear trash?`,
  trashCleared: () => t`Trash cleared successfully!`,
  trash: () => t`Trash`,
  loadingTrash: () => t`Loading trash`,
  trashCleanupIntervalTextDaily: () =>
    t`Trash gets automatically cleaned up daily`,
  trashCleanupIntervalTextDays: (days: number) =>
    t`Trash gets automatically cleaned up after ${days} days`,
  noTrashCleanupInterval: () =>
    t`Set automatic trash cleanup interval from Settings > Behaviour > Clean trash interval.`,
  select: () => t`Select`,
  backupComplete: () => t`Backup complete`,
  backupSaved: (platform: string) =>
    select(platform, {
      android: 'Backup file saved in "Notesnook backups" folder on your phone.',
      other: "Backup file is saved in File Manager/Notesnook folder"
    }),
  shareBackup: () => t`Share backup`,
  neverAskAgain: () => t`Never ask again`,
  backingUpData: (type?: "full" | "partial") =>
    type === "full" ? t`Creating a full backup` : t`Creating a backup`,
  savingAttachmentsInBackup: (hash: string) =>
    t`Saving attachments in backup... ${hash}`,
  writingBackupChunk: (size: number) =>
    t`Writing backup chunk of size... ${size}`,
  savingFile: (path: string) => t`Saving file: ${path}`,
  creatingBackupNamed: (name: string) => t`Creating backup (${name})`,
  backupDataDesc: () =>
    t`All your backups are stored in 'Phone Storage/Notesnook/backups/' folder`,
  backupSuccess: () => t`Backup successful`,
  biometricsAuthFailed: () =>
    t`Biometrics authentication failed. Please try again.`,
  biometricsAuthCancelled: () => t`Authentication cancelled by user`,
  biometricsAuthError: () => t`Authentication failed`,
  tryAgain: () => t`Tap to try again`,
  rateAppMessage: () => t`We would love to know what you think!`,
  rateAppActionText: (platform: string) =>
    platform === "ios"
      ? t`Rate Notesnook on App Store`
      : t`Rate Notesnook on Play Store`,
  recoveryKeyMessage: () => t`Keep your data safe`,
  recoveryKeyMessageActionText: () => t`Save your account recovery key`,
  loginMessage: () => t`You are not logged in`,
  loginMessageActionText: () => t`Login to encrypt and sync notes`,
  syncDisabled: () => t`Sync is disabled`,
  syncDisabledActionText: () => t`Please confirm your email to sync notes`,
  newUpdateMessage: () => t`New update available`,
  newUpdateActionText: () => t`Tap here to update to the latest version`,
  updateNow: () => t`Update now`,
  quickNoteTitle: () => t`Quick note`,
  quickNoteContent: () => t`Tap on "Take note" to add a note.`,
  takeNote: () => t`Take note`,
  quickNotePlaceholder: () => t`Write something...`,
  hide: () => t`Hide`,
  disable: () => t`Disable`,
  notificationsDisabled: () => t`Notifications disabled`,
  notificationsDisabledDesc: () =>
    t`Reminders cannot be set because notifications have been disabled from app settings. If you want to keep receiving reminder notifications, enable notifications for Notesnook from app settings.`,
  openSettings: () => t`Open settings`,
  close: () => t`Close`,
  emailConfirmationLinkSent: () =>
    t`We have sent you an email confirmation link. Please check your email inbox. If you cannot find the email, check your spam folder.`,
  confirmEmailTroubleshoot: () =>
    t`What do I do if I am not getting the email?`,
  confirmEmailTroubleshootNotice: () => [
    t`If you didn't get an email from us or the confirmation link isn't
            working,`,
    t`please send us an email from your registered email address`,
    t`and we will manually confirm your account.`
  ],
  waitBeforeResendEmail: () => t`Please wait before requesting another email`,
  verificationEmailSent: () => t`Verification email sent`,
  failedToSendVerificationEmail: () => t`Failed to send verification email`,
  resendEmail: () => t`Resend email`,
  tips: [
    {
      text: () =>
        t`You can swipe left anywhere in the app to start a new note.`,
      contexts: ["notes", "first-note"]
    },
    {
      text: () => t`Long press on any item in list to enter multi-select mode.`,
      contexts: ["notes", "notebook", "notebook", "tags", "topics"]
    },
    {
      text: () =>
        t`Monographs enable you to share your notes in a secure and private way.`,
      contexts: ["monographs"]
    },
    {
      text: () =>
        t`Monographs can be encrypted with a secret key and shared with anyone.`,
      contexts: ["monographs"]
    },
    {
      text: () =>
        t`You can pin frequently used Notebooks to the Side Menu to quickly access them.`,
      contexts: ["notebook", "notebooks"]
    },
    {
      text: () => t`A notebook can have unlimited topics with unlimited notes.`,
      contexts: ["notebook", "topics"]
    },
    {
      text: () =>
        t`You can multi-select notes and move them to a notebook at once`,
      contexts: ["notebook", "topics"]
    },
    {
      text: () => t`Mark important notes by adding them to favorites.`,
      contexts: ["notes"]
    },
    {
      text: () =>
        t`Are you scrolling a lot to find a specific note? Pin it to the top from Note properties.`,
      contexts: ["notes"]
    },
    {
      text: () =>
        t`You can view & restore older versions of any note by going to its properties -> History.`,
      contexts: ["notes"]
    }
  ],
  popups: [
    {
      id: "sortmenu",
      text: () => t`Tap here to change sorting`
    },
    {
      id: "jumpto",
      text: () => t`Tap here to jump to a section`
    },
    {
      id: "compactmode",
      text: () => t`Try compact mode to fit more items on screen`
    },
    {
      id: "searchreplace",
      text: () => t`Switch to search/replace mode`
    },
    {
      id: "notebookshortcut",
      text: () => t`Create shortcut of this notebook in side menu`
    }
  ],
  someNotesPublished: () => t`Some notes are published`,
  unpublishToDelete: () => t`Unpublish notes to delete them`,
  filterAttachments: () => t`Filter attachments by filename, type or hash`,
  oldPassword: () => t`Current password`,
  newPassword: () => t`New password`,
  email: () => t`Email`,
  confirmPassword: () => t`Confirm password`,
  currentPin: () => t`Current pin`,
  currentPassword: () => t`Current password`,
  newPin: () => t`New pin`,
  confirmPin: () => t`Confirm pin`,
  colorTitle: () => t`Color title`,
  enterNotebookDescription: () => t`Enter notebook description`,
  searchNotebooks: () => t`Search notebooks`,
  enterNewEmail: () => t`Enter your new email`,
  issueTitlePlaceholder: () => t`Tell us what happened`,
  issuePlaceholder: () => t`Tell us more about the issue you are facing.

For example:
- What were you trying to do in the app?
- What did you expect to happen?
- Steps to reproduce the issue
- Things you have tried etc.`,
  searchSectionToLinkPlaceholder: () => t`Type # to search for headings`,
  searchNoteToLinkPlaceholder: () => t`Search a note to link to`,
  searchForTags: () => t`Search or add a tag`,
  searchANote: () => t`Search a note`,
  remindeMeOf: () => t`Remind me of...`,
  addShortNote: () => t`Add a short note`,
  searchingFor: (query: string) => t`Searching for ${query}...`,
  typeAKeyword: () => t`Type a keyword`,
  search: () => t`Search`,
  enterEmailAddress: () => t`Enter email address`,
  enterValidEmail: () => t`Please enter a valid email address`,
  enterValidPhone: () => t`Please enter a valid phone number with country code`,
  errorGettingCodes: () => t`Error getting codes`,
  noResultsFound: (query?: string) =>
    query ? t`No results found for ${query}` : t`No results found`,
  routes: {
    Notes: () => t`Notes`,
    Notebooks: () => t`Notebooks`,
    Favorites: () => t`Favorites`,
    Reminders: () => t`Reminders`,
    Trash: () => t`Trash`,
    Settings: () => t`Settings`,
    Tags: () => t`Tags`,
    Home: () => t`Home`,
    Monographs: () => t`Monographs`,
    Archive: () => t`Archive`
  },
  searchInRoute: (
    routeName: keyof typeof SEARCH_IN_ROUTE_STRINGS | ({} & string)
  ) => {
    return (
      SEARCH_IN_ROUTE_STRINGS[
        routeName as keyof typeof SEARCH_IN_ROUTE_STRINGS
      ]?.() || t`Search in ${routeName}`
    );
  },
  logoutConfirmation: () =>
    t`Are you sure you want to logout and clear all data stored on THIS DEVICE?`,
  backupDataBeforeLogout: () => t`Take a backup before logging out`,
  unsyncedChangesWarning: () =>
    t`You have unsynced notes. Take a backup or sync your notes to avoid losing your critical data.`,
  databaseSetupFailed: () =>
    t`Database setup failed, could not get database key`,
  streamingNotSupported: () => t`Streaming not supported`,
  pleaseWaitBeforeSendEmail: () =>
    t`Please wait before requesting another email`,
  unableToSend2faCode: () => t`Unable to send 2FA code`,
  emailOrPasswordIncorrect: () => t`Email or password incorrect`,
  noNotificationPermission: () =>
    t`Please grant notifications permission to add new reminders.`,
  selectDayError: () => t`Please select the day to repeat the reminder on`,
  dateError: () => t`Reminder time cannot be earlier than the current time.`,
  failedToDecryptBackup: () => t`Failed to decrypt backup`,
  backupDirectoryNotSelected: () => t`Backup directory not selected`,
  legal: () => t`Legal`,
  days: (days: number) =>
    plural(days, {
      one: `1 day`,
      other: `# days`
    }),
  daily: () => t`Daily`,
  weekly: () => t`Weekly`,
  monthly: () => t`Monthly`,
  yearly: () => t`Yearly`,
  minutes: (count: number) =>
    plural(count, {
      one: `1 minute`,
      other: `# minutes`
    }),
  hours: (count: number) =>
    plural(count, {
      one: `1 hour`,
      other: `# hours`
    }),
  immediately: () => t`Immediately`,
  noteTitle: () => t`Note title`,
  changesNotSaved: () => t`Your changes could not be saved`,
  savingNoteTakingTooLong: () =>
    t`Saving this note is taking too long. Copy your changes and restart the app to prevent data loss. If the problem persists, please report it to us at support@streetwriters.co.`,
  changesNotSavedDesc: () =>
    t`It seems that your changes could not be saved. What to do next:`,
  changesNotSavedStep1: () =>
    t`Tap on "Dismiss" and copy the contents of your note so they are not lost.`,
  changesNotSavedStep2: () => t`Restart the app.`,
  thisNoteLocked: () => t`This note is locked`,
  noteLockedBlockLink: () =>
    t`Linking to a specific block is not available for locked notes.`,
  dismiss: () => t`Dismiss`,
  totalWords: (words: number) =>
    plural(words, { one: "# word", other: "# words" }),
  addATag: () => t`Add a tag`,
  startWritingNote: () => t`Start writing your note...`,
  off: () => t`Off`,
  exportedNotesLocked: () =>
    t`Some exported notes are locked, Unlock to export them`,
  selectFolderForBackupFilesDesc: () =>
    t`Select folder where Notesnook backup files are stored to view and restore them from the app`,
  selectBackupFolder: () => t`Select folder with backup files`,
  selectBackupFileDesc: () =>
    t`Select a backup file from your device to restore backup`,
  restoreFromFiles: () => t`Restore from files`,
  recentBackups: () => t`RECENT BACKUPS`,
  restoringBackup: () => t`Restoring backup...`,
  restoringBackupDesc: () => t`Please wait while we restore your backup...`,
  decryptingBackup: () => t`Backup is encrypted, decrypting...`,
  preparingBackupRestore: () => t`Preparing to restore backup file...`,
  readingBackupFile: () => t`Reading backup file...`,
  cleaningUp: () => t`cleaningUp`,
  extractingFiles: () => t`Extracting files...`,
  copyingBackupFileToCache: () => t`Copying backup files to cache`,
  backupEnterPassword: () => t`Please enter password of this backup file`,
  useEncryptionKey: () => t`Use encryption key`,
  testConnection: () => t`Test connection`,
  syncServer: () => t`Sync server`,
  syncServerDesc: () =>
    t`Server used to sync your notes & other data between devices.`,
  authServer: () => t`Auth server`,
  authServerDesc: () => t`Server used for login/sign up and authentication.`,
  sseServer: () => t`Events server`,
  sseServerDesc: () =>
    t`Server used to receive important notifications & events.`,
  monographServer: () => t`Monograph server`,
  monographServerDesc: () => t`Server used to host your published notes.`,
  logoutToChangeServerUrls: () =>
    t`You must log out in order to change/reset server URLs.`,
  enterValidUrl: () => t`Please enter a valid URL`,
  connectedToServer: () => t`Connected to all servers sucessfully.`,
  allServerUrlsRequired: () => t`All server urls are required.`,
  serverNotFound: (host: string) => t`Server with host ${host} not found.`,
  couldNotConnectTo: (server: string) => t`Could not connect to ${server}.`,
  incorrectServerUrl: (url: string, server: string) =>
    t`The URL you have given (${url}) does not point to the ${server}.`,
  serverVersionMismatch: (title: string, url: string) =>
    t`The ${title} at ${url} is not compatible with this client.`,
  testConnectionBeforeSave: () =>
    t`Test connection before changing server urls`,
  serverUrlChanged: () => t`Server url changed`,
  restartAppToTakeEffect: () => t`Restart the app for changes to take effect.`,
  resetServerUrls: () => t`Reset server urls`,
  serverUrlsReset: () => t`Server urls reset`,
  dismissAnnouncement: () => t`Dismiss announcement`,
  uploaded: () => t`Uploaded`,
  waitingForUpload: () => t`Waiting for upload`,
  webAuthTitles: [
    () => t`Write with freedom.`,
    () => t`Privacy comes first.`,
    () => t`Take notes privately.`,
    () => t`Encrypted, private, secure.`,
    () => "❤️ = 🔒 + 🗒️"
  ],
  restoreThisVersion: () => t`Restore this version`,
  autoSaveOff: () => t`Auto save: off`,
  selectedWords: (words: number) => plural(words, { other: "# selected" }),
  dropFilesToAttach: () => t`Drop your files here to attach`,
  noHeadingsFound: () => t`No headings found`,
  somethingWentWrong: () => t`Something went wrong`,
  whatWentWrong: () => t`What went wrong?`,
  howToFix: () => t`How to fix it?`,
  fixIt: () => t`Fix it`,
  reloadApp: () => t`Reload app`,
  contactSupport: () => t`Contact support`,
  databaseCorruptExplain: () =>
    t`This error usually means the database file is either corrupt or it could not be decrypted.`,
  databaseCorruptFix: () =>
    t`This error can only be fixed by wiping & reseting the database. Beware that this will wipe all your data inside the database with no way to recover it later on. This WILL NOT change/affect/delete/wipe your data on the server but ONLY on this device.`,
  decryptKeyErrorExplain: () =>
    t`This error means the at rest encryption key could not be decrypted. This can be due to data corruption or implementation change.`,
  decryptKeyErrorFix: () =>
    t`This error can only be fixed by wiping & reseting the Key Store and the database. This WILL NOT change/affect/delete/wipe your data on the server but ONLY on this device.`,
  searchIndexCorrupt: () =>
    t`This error usually means the search index is corrupted.`,
  searchIndexCorruptFix: () =>
    t`This error can be fixed by rebuilding the search index. This action won't result in any kind of data loss.`,
  loading: () => t`Loading`,
  errorsInAttachments: (count: number) => t`Errors in ${count} attachments`,
  goToNextPage: () => t`Go to next page`,
  goToPreviousPage: () => t`Go to previous page`,
  zoomOut: () => t`Zoom out`,
  zoomIn: () => t`Zoom in`,
  enterFullScreen: () => t`Enter fullscreen`,
  syncingYourNotes: () => t`Syncing your notes`,
  items: () => t`items`,
  itemsSelected: (count: number) =>
    plural(count, {
      one: `# item selected`,
      other: `# items selected`
    }),
  downloadingImages: () => t`Downloading images`,
  checkingForUpdates: () => t`Checking for updates`,
  updating: (percentage: number) => t`${percentage}% updating...`,
  updateCompleted: (version: string) =>
    `v${version} downloaded (click to install)`,
  updateNewVersionAvailable: (version: string) => t`v${version} available`,
  unlocking: () => t`Unlocking`,
  reminderStarts: (date: string, time: string) =>
    t`The reminder will start on ${date} at ${time}.`,
  files: (count: number) =>
    plural(count, {
      one: "# file",
      other: "# files"
    }),
  of: () => t`of`,
  installs: () => t`installs`,
  licenseUnder: (license: string) => t`Licensed under ${license}`,
  pro: () => t`Pro`,
  mfaScanQrCode: () => t`Scan the QR code with your authenticator app`,
  scanQrError: () =>
    t`If you can't scan the QR code above, enter this text instead (spaces don't matter)`,
  mfaScanQrCodeHelpText: () =>
    t`After scanning the QR code image, the app will display a code that you can enter below.`,
  mfaDone: () =>
    t`Your account is now 100% secure against unauthorized logins.`,
  sms: () => t`phone number`,
  app: () => t`authentication app`,
  mfaFallbackMethodText: (
    fallback: "app" | "sms" | "email",
    primary: "app" | "sms" | "email"
  ) =>
    `You will now receive your 2FA codes on your ${strings[
      fallback
    ]().toLocaleLowerCase()} in case you lose access to your ${strings[
      primary
    ]().toLocaleLowerCase()}.`,
  transactionStatusToText: (
    key: keyof typeof TRANSACTION_STATUS | ({} & string)
  ) => {
    return key in TRANSACTION_STATUS
      ? TRANSACTION_STATUS[key as keyof typeof TRANSACTION_STATUS]()
      : key;
  },
  viewReceipt: () => t`View receipt`,
  customDictWords: (count: number) =>
    t`You have ${count} custom dictionary words.`,
  importCompleted: () => t`Import completed`,
  errorsOccured: (count: number) =>
    plural(count, {
      one: "# error occured",
      other: "# errors occured"
    }),
  startOver: () => t`Start over`,
  clickToRemove: () => t`Click to remove`,
  currentPlan: () => t`CURRENT PLAN`,
  appWillReloadIn: (sec: number) => t`App will reload in ${sec} seconds`,
  changesReflectOnStart: () =>
    t`Your changes have been saved and will be reflected after the app has refreshed.`,
  edit: () => t`Edit`,
  yourFullName: () => t`Your full name`,
  memberSince: (date: string) => t`Member since ${date}`,
  betaLoginNotice: () =>
    t`You are logging into the beta version of Notesnook. Switching between beta &amp; stable versions can cause weird issues including data loss. It is recommended that you do not use both simultaneously.`,
  loggingIn: () => t`Logging you in`,
  pleaseWaitLogin: () => t`Please wait while you are authenticated.`,
  emailConfirmed: () => t`Your email has been confirmed.`,
  confirmEmailThankyou: () =>
    t`Thank you for choosing end-to-end encrypted note taking. Now you can sync your notes to unlimited devices.`,
  shareWithFriends: () => t`Share Notesnook with friends!`,
  tagPromoWinText: () => [
    t`Use`,
    t`#notesnook`,
    t`and get a chance to win free promo codes.`
  ],
  shareWithFriendsDesc: () => t`Because where's the fun in nookin' alone?`,
  authenticatedAs: (email: string) => t`Authenticated as ${email}`,
  rememberedYourPassword: () => t`Remembered your password?`,
  chooseRecoveryMethod: () => t`Choose a recovery method`,
  chooseRecoveryMethodDesc: () => t`How do you want to recover your account?`,
  recoveryKeyMethod: () => t`Use recovery key`,
  recoveryKeyMethodDesc: () =>
    t`Your data recovery key is basically a hashed version of your password (plus some random salt). It can be used to decrypt your data for re-encryption.`,
  clearDataAndResetMethod: () => t`Clear data & reset account`,
  clearDataAndResetMethodDesc: () =>
    t`EXTREMELY DANGEROUS! This action is irreversible. All your data including notes, notebooks, attachments & settings will be deleted. This is a full account reset. Proceed with caution.`,

  dontShowAgainConfirm: () => t`Don't show again on this device?`,
  toggleDarkLightMode: () => t`Toggle dark/light mode`,
  goToTag: (tag: string) => t`Go to #${tag}`,
  tagNotFound: () => t`Tag not found`,
  downloadAllAttachments: () => t`Download all attachments`,
  selectProfilePicture: () => t`Select profile picture`,
  changeProfilePicture: () => t`Change profile picture`,
  editFullName: () => t`Edit your full name`,
  reset: () => t`Reset`,
  resetSelection: () => t`Reset selection`,
  unlockWithSecurityKey: () => t`Unlock with security key`,
  reloginToYourAccount: () => t`Relogin to your account`,
  skipAndGoToApp: () => t`Use offline`,
  startAccountRecovery: () => t`Start account recovery`,
  dontHaveRecoveryKey: () => t`Don't have your account recovery key?`,
  filterLanguages: () => t`Filter languages`,
  searchThemes: () => t`Search themes`,
  olderVersion: () => t`Older version`,
  currentNote: () => t`Current note`,
  incomingNote: () => t`Incoming note`,
  description: () => t`Description`,
  date: () => t`Date`,
  month: () => t`Month`,
  day: () => t`Day`,
  time: () => t`Time`,
  encryptionKey: () => t`Encryption key`,
  color: () => t`Color`,
  sixDigitCode: () => t`6 digit code`,
  newEmail: () => t`New Email`,
  accountPassword: () => t`Account password`,
  phoneNumber: () => t`Phone number`,
  createAccount: () => t`Create account`,
  accountRecoverHelpText: () =>
    t`You will receive instructions on how to recover your account on this email`,
  enterRecoveryKey: () => t`Enter account recovery key`,
  enterRecoveryKeyHelp: () =>
    t`Your data recovery key will be used to decrypt your data`,
  newPasswordHelp: () => t`Your account password must be strong & unique.`,
  optional: () => t`Optional`,
  sendRecoveryEmail: () => t`Send recovery email`,
  enterPasswordToUnlockVersion: () =>
    t`Please enter the password to view this version`,
  openNote: () => t`Open note`,
  enterPasswordToUnlockNote: () =>
    t`Please enter the password to unlock this note`,
  properties: () => t`Properties`,
  clickToPreview: () => t`Click to preview`,
  clearCache: () => t`Clear cache`,
  clearCacheDesc: (cacheSize: number) =>
    t`Clear all cached attachments. Current cache size: ${cacheSize}`,
  clearCacheConfirm: () => t`Clear attachments cache?`,
  clearCacheConfirmDesc:
    () => t`Clearing attachments cache will perform the following actions:

- Downloaded images & files: **cleared**
- Pending uploads: **cleared**
- Uploaded images & files: _unaffected_

All attachments will be downloaded & cached again on access.

---

**Only use this for troubleshooting purposes. If you are having persistent issues, it is recommended that you reach out to us via support@streetwriters.co so we can help you resolve it permanently.**`,
  cacheCleared: () => t`Attachments cache cleared!`,
  gettingEncryptionKey: () => t`Getting encryption key...`,
  keyBackedUp: () => t`I have saved my key`,
  groupAdded: () => t`Group added successfully`,
  welcomeBack: () => t`Welcome back!`,
  verifyingEmail: () => t`Verifying your email`,
  authWait: () => t`Please wait while you are authenticated.`,
  accountPassDesc: () =>
    t`Your password is always hashed before leaving this device.`,
  creatingAccount: () => t`Creating your account`,
  creatingAccountDesc: () => t`Please wait while we finalize your account.`,
  sendingRecoveryEmail: () => t`Sending recovery email`,
  sendingRecoveryEmailDesc: () =>
    t`Please wait while we send you recovery instructions`,
  authenticatingUser: () => t`Authenticating user`,
  accountRecoveryWithKey: () =>
    t`Use a data recovery key to reset your account password.`,
  keyRecoveryProgressDesc: () =>
    t`Please wait while your data is downloaded & decrypted.`,
  verifying2faCode: () => t`Verifying 2FA code`,
  coreRequired: () => t`2FA code is required()`,
  backingUpDataWait: () =>
    t`We are creating a backup of your data. Please wait...`,
  resetAccountPassword: () => t`Reset account password`,
  resettingAccountPassword: (progress: number) =>
    t`Resetting account password (${progress})`,
  resetPasswordWait: () => t`Please wait while we reset your account password.`,
  backupSavedAt: (path: string) => t`Backup saved at ${path}`,
  irreverisibleAction: () => t`This action is IRREVERSIBLE.`,

  doActions,
  actions,
  inProgressActions,
  actionErrors,
  actionConfirmations,

  backupReadyToDownload: () => t`Your backup is ready to download`,
  vaultUnlocked: () => t`Vault unlocked`,
  vaultLocked: () => t`Vault locked`,
  unlockVault: () => t`Unlock vault`,
  unlockVaultDesc: () => t`Please enter your vault password to continue`,
  imagePreviewFailed: () => t`This image cannot be previewed`,
  attachmentPreviewFailed: () => t`Attachment preview failed`,
  failedToCopyNote: () => t`Failed to copy note`,
  noteDoesNotExist: () => t`Note does not exist`,
  couldNotConvertNote: (format: string) =>
    t`Could not convert note to ${format}.`,
  remindersNotSupported: () =>
    t`Reminders will not be active on this device as it does not support notifications.`,
  invalidHexColor: () => t`Please enter a valid hex color (e.g. #ffffff)`,
  profileUpdated: () => t`Profile updated`,
  assignedToNotebookMessage: (
    notes: number,
    added: number,
    removed: number
  ) => {
    const n = plural(notes, {
      one: `1 note`,
      other: `# notes`
    });
    if (added === 0 && removed > 0)
      return t`${n} ${plural(removed, {
        one: `removed from 1 notebook`,
        other: `removed from # notebooks`
      })}.`;
    else if (added > 0 && removed === 0)
      return t`${n} ${plural(added, {
        one: `added to 1 notebook`,
        other: `added to # notebooks`
      })}.`;
    else
      return t`${n} ${plural(added, {
        one: `added to 1 notebook`,
        other: `added to # notebooks`
      })} and ${plural(removed, {
        one: `removed from 1 notebook`,
        other: `removed from # notebooks`
      })}.`;
  },
  noEncryptionKeyFound: () => t`No encryption key found`,
  securityKeyRegistered: () => t`Security key successfully registered.`,
  restartNow: () => t`Restart now`,
  copied: () => t`Copied`,
  invalidCors: () => t`Invalid CORS proxy url`,
  vaultCleared: () => t`Vault cleared`,
  vaultDeleted: () => t`Vault deleted`,
  subgroupAdded: () => t`Subgroup added`,
  refundIssued: () =>
    t`Your refund has been issued. Please wait 24 hours before reaching out to us in case you do not receive your funds.`,
  failedToInstallTheme: () => t`Failed to install theme.`,
  fullNameUpdated: () => t`Full name updated`,
  shortcutRemoved: () => t`Shortcut removed`,
  recheckFailed: () => t`Rechecking failed`,
  failedToDelete: () => t`Failed to delete`,
  failedToRegisterTask: () => t`Failed to register task`,
  couldNotClearTrash: () => t`Could not clear trash.`,
  automaticBackupsDisabled: () => t`Automatic backups disabled`,
  automaticBackupsDisabledDesc: () =>
    t`Please enable automatic backups to avoid losing important data.`,
  default: () => t`Default`,
  minimal: () => t`Minimal`,
  custom: () => t`Custom`,
  disableEditorMargins: () => t`Disable editor margins`,
  enableEditorMargins: () => t`Enable editor margins`,
  exitFullScreen: () => t`Exit fullscreen`,
  normalMode: () => t`Normal mode`,
  focusMode: () => t`Focus mode`,
  closeOthers: () => t`Close others`,
  closeToRight: () => t`Close to the right`,
  closeToLeft: () => t`Close to the left`,
  closeAll: () => t`Close all`,
  revealInList: () => t`Reveal in list`,
  orderBy: () => t`Order by`,
  oldestToNewest: () => t`Oldest - newest`,
  newestToOldest: () => t`Newest - oldest`,
  sort: () => t`Sort`,
  jumpToGroup: () => t`Jump to group`,
  rotateLeft: () => t`Rotate left`,
  rotateRight: () => t`Rotate right`,
  website: () => t`Website`,
  resetSidebar: () => t`Reset sidebar`,
  removeColor: () => doActions.remove.color(1),
  favorite: () => t`Favorite`,
  assignColor: () => t`Assign color`,
  print: () => t`Print`,
  exportAs: (format?: string) => t`Export as${format ? " " + format : ""}`,
  copyAs: (format?: string) => t`Copy as${format ? " " + format : ""}`,
  activate: () => t`Activate`,
  deactivate: () => t`Deactivate`,
  minimize: () => t`Minimize`,
  maximize: () => t`Maximize`,
  size: () => t`Size`,
  dateUploaded: () => t`Date uploaded`,
  editingTagDesc: (tag: string) => t`You are editing #${tag}`,
  applyingChanges: () => t`Applying changes`,
  thisMayTakeAWhile: () => t`This may take a while`,
  processing: () => t`Processing...`,
  processingCollection: (collection: string) => t`Processing ${collection}...`,
  credientials: () => t`Credentials`,
  thankYouForReporting: () => t`Thank you for reporting!`,
  thankYouForFeedback: () => t`Thank you for your feedback!`,
  yourSupportRequestHasBeenForwarded: () =>
    t`Your support request has been forwarded`,
  bugReportMessage: (
    url: string
  ) => t`You can track your bug report at [${url}](${url}).

Please note that we will respond to your bug report on the link above. **We recommend that you save the above link for later reference.**

If your issue is critical (e.g. notes not syncing, crashes etc.), please [join our Discord community](https://go.notesnook.com/discord) for one-to-one support.`,
  supportEmailMessage: () =>
    t`Your support request has been forwarded to our support team. We will get back to you via email as soon as possible. If you don't receive an email from us within 24-48 hours, please send us an email directly at support@notesnook.com.`,
  featureRequestMessage: (
    url: string
  ) => t`You can track your feature request at [${url}](${url}).

Please note that we will respond to your feature request on the link above. **We recommend that you save the above link for later reference.**`,

  thankYouPrivacy: () =>
    t`Thank you. You are the proof that privacy always comes first.`,
  passwordPin: () => t`Password/pin`,
  passwordPinDescription: () => t`The password/pin for unlocking the app.`,
  securityKey: () => t`Security key`,
  securityKeyDescription: () =>
    t`The security key for unlocking the app. This is the most secure method.`,
  unregister: () => t`Unregister`,
  register: () => t`Register`,
  enterPasswordOrPin: () => t`Enter pin or password to enable app lock.`,
  securityKeyUsername: () => t`Enter your username`,
  securityKeyUsernameDesc: () =>
    t`This username will be used to distinguish between different credentials in your security key. Make sure it is unique.`,
  general: () => t`General`,
  zoomFactor: () => t`Zoom factor`,
  zoomFactorDescription: () => t`Zoom in or out the app content.`,
  colorScheme: () => t`Color scheme`,
  colorSchemeDescription: () => t`Dark or light, we won't judge.`,
  auto: () => t`Auto`,
  selectTheme: () => t`Select a theme`,
  chooseBackupFormat: () => t`Choose backup format`,
  backup: () => t`Backup`,
  backupWithAttachments: () => t`Backup with attachments`,
  dateAndTime: () => t`Date & time`,
  desktopApp: () => t`Desktop app`,
  automaticUpdates: () => t`Automatic updates`,
  automaticUpdatesDesc: () =>
    t`Automatically download & install updates in the background without prompting first.`,
  desktopIntegration: () => t`Desktop integration`,
  autoStartOnSystemStartup: () => t`Auto start on system startup`,
  autoStartDescription: () =>
    t`If true, Notesnook will automatically start up when you turn on & login to your system.`,
  startMinimized: () => t`Start minimized`,
  startMinimizedDescription: () =>
    t`If true, Notesnook will start minimized to either the system tray or your system taskbar/dock. This setting only works with Auto start on system startup is enabled.`,
  minimizeToSystemTray: () => t`Minimize to system tray`,
  minimizeToSystemTrayDescription: () =>
    t`Pressing "—" will hide the app in your system tray.`,
  closeToSystemTray: () => t`Close to system tray`,
  closeToSystemTrayDescription: () =>
    t`Pressing "X" will hide the app in your system tray.`,
  useNativeTitlebar: () => t`Use native titlebar`,
  useNativeTitlebarDescription: () =>
    t`Use native OS titlebar instead of replacing it with a custom one. Requires app restart for changes to take effect.`,
  spellCheck: () => t`Spell check`,
  enableSpellChecker: () => t`Enable spell checker`,
  languages: () => t`Languages`,
  spellCheckerLanguagesDescription: () =>
    t`Select the languages the spell checker should check in.`,
  customDictionaryWords: () => t`Custom dictionary words`,
  toolbar: () => t`Toolbar`,
  profile: () => t`Profile`,
  authentication: () => t`Authentication`,
  sync: () => t`Sync`,
  behaviour: () => t`Behaviour`,
  notifications: () => t`Notifications`,
  servers: () => t`Servers`,
  serversConfiguration: () => t`Servers configuration`,
  importExport: () => t`Import & export`,
  backupExport: () => t`Backup & export`,
  notesnookImporter: () => t`Notesnook Importer`,
  privacy: () => t`Privacy`,
  other: () => t`Other`,
  newVersionAvailable: (version: string) =>
    `New version (v${version}) is available for download.`,
  installUpdate: () => t`Install update`,
  sourceCode: () => t`Source code`,
  sourceCodeDescription: () =>
    t`All the source code for Notesnook is available & open for everyone on GitHub.`,
  viewSourceCode: () => t`View source code`,
  checkRoadmap: () => t`Check roadmap`,
  availableOnIOS: () => t`Available on iOS`,
  availableOnIOSAndAndroid: () => t`Available on iOS & Android`,
  availableOnIOSDescription: () =>
    t`Get Notesnook app on your iPhone and access all your notes on the go.`,
  availableOnIOSAndAndroidDescription: () =>
    t`Get Notesnook app on your iPhone or Android device and access all your notes on the go.`,
  joinCommunity: () => t`Join community`,
  license: () => t`License`,
  licenseDescription: () => t`GNU GENERAL PUBLIC LICENSE Version 3`,
  follow: () => t`Follow`,
  report: () => t`Report`,
  send: () => t`Send`,
  hideNoteTitle: () => t`Hide note title`,
  hideNoteTitleDescription: () =>
    t`Prevent note title from appearing in tab/window title.`,
  advanced: () => t`Advanced`,
  useCustomDns: () => t`Use custom DNS`,
  customDnsDescription: () =>
    t`Notesnook uses the following DNS providers:

1. Cloudflare DNS
2. Quad9

This can sometimes bypass local ISP blockages on Notesnook traffic. Disable this if you want the app to use system's DNS settings.`,
  changeProxy: () => t`Change proxy`,
  proxy: () => t`Proxy`,
  proxyDescription: () =>
    t`Setup an HTTP/HTTPS/SOCKS proxy.

For example:
http://foobar:80
socks4://proxy.example.com
http://username:password@foobar:80

To remove the proxy, simply erase everything in the input.`,
  sessions: () => t`Sessions`,
  loggedOut: () => t`You have been logged out.`,
  logoutAllOtherDevices: () => t`Log out from all other devices`,
  logoutAllOtherDevicesDescription: () =>
    t`Force logout from all your other logged in devices.`,
  clearSessions: () => t`clear sessions`,
  loggedOutAllOtherDevices: () =>
    t`You have been logged out from all other devices.`,
  paymentMethod: () => t`Payment method`,
  changePaymentMethodDescription: () =>
    t`Change the payment method you used to purchase this subscription.`,
  billingHistory: () => t`Billing history`,
  failedToTakeBackup: () => t`Failed to take backup`,
  failedToTakeBackupMessage: () =>
    t`Failed to take backup of your data. Do you want to continue logging out?`,
  fullOfflineMode: () => t`Full offline mode`,
  fullOfflineModeDesc: () =>
    t`Download everything including attachments on sync`,
  havingProblemsWithSync: () => t`Having problems with sync?`,
  understand: () => t`I understand`,
  havingProblemsWithSyncDesc: () =>
    t`Force push:
Use this if changes made on this device are not appearing on other devices. This will overwrite the data on the server with the data from this device.

Force pull:
Use this if changes from other devices are not appearing on this device. This will overwrite the data on this device with the latest data from the server.

**These must only be used for troubleshooting. Using them regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.**`,
  checkingAttachments: () => t`Checking attachments`,
  orderId: () => t`Order ID`,
  amount: () => t`Amount`,
  status: () => t`Status`,
  receipt: () => t`Receipt`,
  subgroupOne: () => t`Subgroup 1`,
  okay: () => t`Okay`,
  clearTrashDesc: () =>
    t`Clearing trash will permanently delete all the items in your trash. This action is IRREVERSIBLE.`,
  createdAt: () => t`Created at`,
  lastEditedAt: () => t`Last edited at`,
  insertLink: () => t`Insert link`,
  editLink: () => t`Edit link`,
  insert: () => t`Insert`,
  moveToTrashDesc: (interval: number) =>
    t`These items will be **kept in your Trash for ${interval} days** after which they will be permanently deleted.`,
  editNotebookDesc: (notebookTitle: string) =>
    t`You are editing "${notebookTitle}".`,
  newNotebookDesc: () => t`Notebooks are the best way to organize your notes.`,
  encryptedBackup: () => t`Encrypted backup`,
  encryptedBackupDesc: () =>
    t`Please enter the password to decrypt and restore this backup.`,
  addToDictionary: () => t`Add to dictionary`,
  cut: () => t`Cut`,
  copyLinkText: () => t`Copy link text`,
  copyImage: () => t`Copy image`,
  paste: () => t`Paste`,
  pasteAndMatchStyle: () => t`Paste and match style`,
  pasteWithoutFormatting: () => t`Paste without formatting`,
  configure: () => t`Configure`,
  usingOfficialInstance: () => t`Using official Notesnook instance`,
  usingInstance: (instance: string, version: string) =>
    t`Using ${instance} (v${version})`,

  bold: () => t`Bold`,
  italic: () => t`Italic`,
  underline: () => t`Underline`,
  strikethrough: () => t`Strikethrough`,
  noteLink: () => t`Bi-directional note link`,
  link: () => t`Link`,
  linkEdit: () => t`Edit link`,
  linkRemove: () => t`Remove link`,
  openLink: () => t`Open link`,
  // copyLink: () => t`Copy link`,
  linkSettings: () => t`Link settings`,
  code: () => t`Code`,
  codeRemove: () => t`Code remove`,
  formatClear: () => t`Clear all formatting`,
  subscript: () => t`Subscript`,
  superscript: () => t`Superscript`,
  // insert: () => t`Insert`,
  bulletList: () => t`Bullet list`,
  numberedList: () => t`Numbered list`,
  checklist: () => t`Checklist`,
  fontFamily: () => t`Font family`,
  fontSize: () => t`Font size`,
  headings: () => t`Headings`,
  alignCenter: () => t`Align center`,
  ltr: () => t`Text direction`,
  highlight: () => t`Highlight`,
  textColor: () => t`Text color`,
  mathInline: () => t`Math (inline)`,
  tableSettings: () => t`Table settings`,
  columnProperties: () => t`Column properties`,
  rowProperties: () => t`Row properties`,
  cellProperties: () => t`Cell properties`,
  insertColumnLeft: () => t`Insert column left`,
  insertColumnRight: () => t`Insert column right`,
  moveColumnLeft: () => t`Move column left`,
  moveColumnRight: () => t`Move column right`,
  deleteColumn: () => t`Delete column`,
  splitCells: () => t`Split cells`,
  mergeCells: () => t`Merge cells`,
  insertRowAbove: () => t`Insert row above`,
  insertRowBelow: () => t`Insert row below`,
  moveRowUp: () => t`Move row up`,
  moveRowDown: () => t`Move row down`,
  deleteRow: () => t`Delete row`,
  deleteTable: () => t`Delete table`,
  cellBackgroundColor: () => t`Cell background color`,
  backgroundColor: () => t`Background color`,
  cellBorderColor: () => t`Cell border color`,
  cellTextColor: () => t`Cell text color`,
  cellBorderWidth: () => t`Cell border width`,
  none: () => t`None`,
  imageSettings: () => t`Image settings`,
  // alignCenter: () => t`Align center`,
  alignLeft: () => t`Align left`,
  alignRight: () => t`Align right`,
  imageProperties: () => t`Image properties`,
  previewAttachment: () => t`Preview attachment`,
  more: () => t`More`,
  attachmentSettings: () => t`Attachment settings`,
  downloadAttachment: () => t`Download attachment`,
  embedSettings: () => t`Embed settings`,
  // alignCenter: () => t`Align center`,
  // alignLeft: () => t`Align left`,
  // alignRight: () => t`Align right`,
  embedProperties: () => t`Embed properties`,
  webclipSettings: () => t`Web clip settings`,
  fullscreen: () => t`Full screen`,
  openInNewTab: () => t`Open in new tab`,
  openSource: () => t`Open source`,
  outdent: () => t`Lift list item`,
  indent: () => t`Sink list item`,

  chooseBlockToInsert: () => t`Choose a block to insert`,
  horizontalRule: () => t`Horizontal rule`,
  codeBlock: () => t`Code block`,
  quote: () => t`Quote`,
  mathAndFormulas: () => t`Math & formulas`,
  callout: () => t`Callout`,
  image: () => t`Image`,
  insertImage: () => t`Insert an image`,
  uploadFromDisk: () => t`Upload from disk`,
  takePhotoUsingCamera: () => t`Take a photo using camera`,
  table: () => t`Table`,
  insertTable: () => t`Insert a table`,
  embed: () => t`Embed`,
  insertEmbed: () => t`Insert an embed`,
  attachment: () => t`Attachment`,
  taskList: () => t`Task list`,
  outlineList: () => t`Outline list`,
  attachImageFromURL: () => t`Attach image from URL`,

  paragraph: () => t`Paragraph`,
  heading: (level: number) => t`Heading ${level}`,

  toggleIndentationMode: () => t`Toggle indentation mode`,
  changeLanguage: () => t`Change language`,
  selectLanguage: () => t`Select language`,
  spaces: () => t`Spaces`,
  lineColumn: (line: number, column: number) =>
    t`Line ${line}, Column ${column}`,
  selectedCode: (selected: number) => t`${selected} selected`,
  searchLanguages: () => t`Search languages`,

  untitled: () => t`Untitled`,
  readonlyTaskList: () => t`Make task list readonly`,
  sortTaskList: () => t`Move all checked tasks to bottom`,
  clearCompletedTasks: () => t`Clear completed tasks`,

  chooseCustomColor: () => t`Choose custom color`,
  deleteMode: () => t`Delete mode`,

  fromURL: () => t`From URL`,
  enterEmbedSourceURL: () => t`Enter embed source URL`,
  pasteEmbedCode: () => t`Paste embed code here. Only iframes are supported.`,
  fromCode: () => t`From code`,

  expand: () => t`Expand`,
  matchCase: () => t`Match case`,
  matchWholeWord: () => t`Match whole word`,
  replace: () => t`Replace`,
  replaceAll: () => t`Replace all`,
  nextMatch: () => t`Next match`,
  previousMatch: () => t`Previous match`,
  toggleReplace: () => t`Toggle replace`,
  enableRegex: () => t`Enable regex`,

  width: () => t`Width`,
  height: () => t`Height`,
  pasteImageURL: () => t`Paste image URL here`,
  linkText: () => t`Link text`,
  url: () => t`URL`,

  insertTableOfSize: (rows: number, columns: number) =>
    t`Insert a ${rows}x${columns} table`,
  setTableSizeNotice: () => t`Please set a table size`,
  clickToReset: (title: string) => t`Click to reset ${title}`,
  increase: (title: string) => t`Increase ${title}`,
  decrease: (title: string) => t`Decrease ${title}`,
  saved: () => t`Saved`,
  saving: () => t`Saving`,
  attachmentRecheckCancelled: () => t`Attachment recheck cancelled`,
  attachmentRecheckComplete: () => t`Attachments recheck complete`,
  checkingNoteAttachments: () => t`Checking note attachments`,
  checkingAllAttachments: () => t`Checking all attachments`,
  passed: () => t`Passed`,
  failed: () => t`Failed`,
  cacheClearedDesc: () => t`All cached attachments have been cleared.`,
  restoreBackupConfirm: () => t`Restore backup?`,
  serversConfigurationDesc: () => t`Configure server URLs for Notesnook`,
  error: () => t`Error`,
  deleteContainingNotes: (count: number) =>
    plural(count, {
      one: `Move all notes in this notebook to trash`,
      other: `Move all notes in these notebooks to trash`
    }),
  emailCopied: () => t`Email copied`,
  redeemGiftCode: () => t`Redeem gift code`,
  redeemGiftCodeDesc: () => t`Enter the gift code to redeem your subscription.`,
  redeemingGiftCode: () => t`Redeeming gift code`,
  redeem: () => t`Redeem`,
  searchForNotesNotebooksAndTags: () =>
    t`Search for notes, notebooks, and tags...`,
  executeACommand: () => t`Execute a command...`,
  execute: () => t`Execute`,
  quickOpen: () => t`Quick open`,
  commandPalette: () => t`Command palette`,
  navigate: () => t`Navigate`,
  nextTab: () => t`Next tab`,
  previousTab: () => t`Previous tab`,
  goForwardInTab: () => t`Go forward in tab`,
  goBackInTab: () => t`Go back in tab`,
  attachmentManager: () => t`Attachment manager`,
  newTag: () => t`New tag`,
  closeCurrentTab: () => t`Close current tab`,
  closeAllTabs: () => t`Close all tabs`,
  toggleTheme: () => t`Toggle theme`,
  actionsForNote: (title: string) => t`Actions for note: ${title}`,
  actionsForNotebook: (title: string) => t`Actions for notebook: ${title}`,
  actionsForTag: (title: string) => t`Actions for tag: ${title}`,
  recents: () => t`Recents`,
  removeFromRecents: () => t`Remove from recents`,
  releaseTrack: () => t`Release track`,
  releaseTrackDesc: () => t`Select the release track for Notesnook.`,
  stable: () => t`Stable`,
  beta: () => t`Beta`,
  zoom: () => t`Zoom`,
  toggleFocusMode: () => t`Toggle focus mode`,
  fontLigatures: () => t`Font ligatures`,
  fontLigaturesDesc: () =>
    t`Enable ligatures for common symbols like →, ←, etc`,
  expandSidebar: () => t`Expand sidebar`,
  viewAllLimits: () => t`View all limits`,
  freePlan: () => t`Free plan`,
  proPlan: () => t`Pro plan`,
  essentialPlan: () => t`Essential plan`,
  believerPlan: () => t`Believer plan`,
  storage: () => t`Storage`,
  used: () => t`used`,
  linkingNotesTo: (title: string) => t`Select notes to link to "${title}"`,
  addToNotebook: () => t`Add to notebook`,
  notebookAdded: () => t`Notebook added`,
  addNotes: () => t`Add notes`,
  setAsHomepage: () => t`Set as homepage`,
  defaultSidebarTab: () => t`Default sidebar tab`,
  defaultSidebarTabDesc: () => t`Select the default sidebar tab`,
  unsetAsHomepage: () => t`Reset homepage`,
  archive: () => t`Archive`,
  yourArchiveIsEmpty: () => t`Your archive is empty`,
  unarchive: () => t`Unarchive`,
  moveNotebookDesc: () =>
    t`Select a notebook to move this notebook into, or unselect to move it to the root level.`,
  words: () => t`Words`,
  characters: () => t`Characters`,
  paragraphs: () => t`Paragraphs`,
  noNotebooksSelectedToMove: () => t`No notebooks selected to move`,
  scrollToTop: () => t`Scroll to top`,
  scrollToBottom: () => t`Scroll to bottom`,
  emailConfirmedDesc: () =>
    t`Your email has been confirmed. You can now securely sync your encrypted notes across all devices.`,
  charactersCount: (count: number) => t`${count} characters`,
  iAlreadyHaveAnAccount: () => t`I already have an account`,
  upgradePlan: () => t`Upgrade plan`,
  upgrade: () => t`Upgrade`,
  checkoutFaqs: [
    {
      question: () => t`What happens to my data if I switch plans?`,
      answer: () =>
        t`Your data remains 100% accessible regardless of what plan you are on. That includes your notes, notebooks, attachments, and anything else you might have created.`
    },
    {
      question: () =>
        t`Why do you need my credit card details for a free trial?`,
      answer: () =>
        t`We require credit card details to fight abuse and to make it seamless for you to upgrade. Your credit card is NOT charged until your free trial ends and your subscription starts. You will be notified via email of the upcoming charge before your trial ends.`
    },
    {
      question: () => t`Can I cancel my free trial anytime?`,
      answer: () =>
        t`Yes, you can cancel your trial anytime. No questions asked.`
    },
    {
      question: () => t`What is your refund policy?`,
      answer: () =>
        t`For a monthly subscription, you can get a refund within 7 days of purchase. For a yearly subscription, we offer a full refund within 14 days of purchase. For a 5 year subscription, you can request a refund within 30 days of purchase.`
    }
  ],
  upgradePlanTo: (plan: string) =>
    t`Upgrade plan to ${plan} to use this feature.`,
  upgradeToPlan: (plan: string, price: string) =>
    t`Upgrade to ${plan} ${price}`,
  tryItForFree: () => t`Try it for free`,
  getThisAndSoMuchMore: () => t`Get this and so much more:`,
  cloudSpace: () => t`cloud storage space for storing images and files.`,
  appLockFeatureBenefit: () =>
    t`for locking your notes as soon as app enters background`,
  advancedNoteTaking: [
    () => t`Use advanced note taking features like`,
    () => t`tables, outlines, block level note linking`,
    () => t`and much more.`
  ],
  cancelAnytime: () => t`Cancel anytime.`,
  googleReminderTrial: () =>
    t`Google will remind you 2 days before your trial ends.`,
  exploreAllPlans: () => t`Explore all plans`,
  tryPlanForFree: (plan: string) => t`Try ${plan} for free`,
  plan: (plan: string) => t`${plan} plan`,
  notesnookPlans: [() => t`Notesnook`, () => t`Plans`],
  readyToTakeNextStep: () =>
    t`Ready to take the next step on your private note taking journey?`,
  percentOff: (discount: string) => t`${discount}% off`,
  percentOffInCountry: (amount: number, country: string) =>
    t`${amount}% off in ${country}`,
  recommendedByPrivacyGuides: () => t`Recommended by Privacy Guides`,
  featuredOn: () => t`Featured on`,
  comparePlans: () => t`Compare plans`,
  faqs: () => t`FAQs`,
  thankYouForSubscribing: () => t`Thank you for subscribing`,
  settingUpPlan: () =>
    t`We’re setting up your plan right now. We’ll notify you as soon as everything is ready.`,
  hdImages: () => t`hdImages`,
  billedAnnually: (price: string) => t`billed annually at ${price}`,
  billedMonthly: (price: string) => t`billed monthly at ${price}`,
  billedEvery5Years: (price: string) => t`billed every 5 years at ${price}`,
  dueToday: () => t`Due today`,
  daysFree: (days: string) => t`${days} days free`,
  due: (date: string) => t`Due ${date}`,
  "5yearPlanConditions": () => [
    t`One time purchase, no auto-renewal`,
    t`Pay once and use for 5 years`
  ],
  trialPlanConditions: [
    (duration: number) => t`Free ${duration} day trial, cancel any time`,
    (platform: "ios" | "android") =>
      t`${platform === "ios" ? "Apple" : "Google"
        } will remind you before your trial ends`
  ],
  purchase: () => t`Purchase`,
  subscribe: () => t`Subscribe`,
  subscribeAndStartTrial: () => t`Subscribe and start free trial`,
  oneTimePurchase: () => t`This is a one time purchase, no subscription.`,
  cancelAnytimeAlt: () => t`Cancel anytime, subscription auto-renews.`,
  subTerms: [
    () => t`By joining you agree to our`,
    () => t`privacy policy`,
    () => t`and`,
    () => t`terms of use.`
  ],
  bestValue: () => t`Best value`,
  planLimits: () => t`Plan limits`,
  unlimited: () => t`Unlimited`,
  fiveYearPlan: () => t`5 year plan (One time purchase)`,
  educationPlan: () => t`Education plan`,
  welcomeToPlan: (plan: string) => t`Welcome to Notesnook ${plan}`,
  thankYouForPurchase: () => t`Thank you for the purchase`,
  changePlan: () => t`Change plan`,
  contactSupportToChangePlan: () =>
    t`You have made a one time purchase. To change your plan please contact support.`,
  alreadySubscribed: () => t`You are already subscribed to this plan.`,
  specialOffer: () => t`Special Offer`,
  changePlanOnWeb: () =>
    t`You can change your subscription plan from the web app`,
  announcement: () => t`ANNOUNCEMENT`,
  cannotChangePlan: () =>
    t`Your current subscription does not allow changing plans`,
  upgradeToRedeem: () => t`Upgrade to redeem`,
  redeemCode: () => t`Redeem code`,
  notesnookCircle: () => t`Notesnook Circle`,
  notesnookCircleDesc: () =>
    t`Notesnook Circle brings together trusted partners who share our commitment to privacy, transparency, and user freedom.`,
  trialUserCircleNotice: () =>
    `Notesnook Circle is reserved for members with an active subscription. You'll get full access after your trial period is over and your subscription is confirmed.`,
  freeUserCircleNotice: () =>
    t`The Notesnook Circle is exclusive to subscribers. Please consider subscribing to gain access to Notesnook Circle and enjoy additional benefits.`,
  finishPurchaseInBrowser: () => t`Finish your purchase in the browser.`,
  goBack: () => t`Go back`,
  clickToDirectlyClaimPromo: () =>
    t`Click here to directly claim the promotion.`,
  loginToUploadAttachments: () =>
    t`Login to upload attachments. [Read more](https://notesnook.com/help/faqs/login-to-upload-attachments)`,
  views: () => t`Views`,
  noPassword: () => t`No password`,
  publishToTheWeb: () => t`Publish to the web`,
  addToHome: () => t`Add to home`,
  clickToSave: () => t`Click to save`,
  lineHeight: () => t`Line height`,
  lineHeightDesc: () => t`Adjust the line height of the editor`,
  enterTitle: () => t`Enter title`,
  dayFormat: () => t`Day format`,
  dayFormatDesc: () => t`Choose how day is displayed in the app`,
  trialOnGoing: (trialExpiryDate: string) =>
    t`Your free trial is on-going. Your subscription will start on ${trialExpiryDate}`,
  weekFormat: () => t`Week format`,
  weekFormatDesc: () =>
    t`Choose what day to display as the first day of the week`,
  editCreationDate: () => t`Edit creation date`,
  unlockIncomingNote: () => t`Unlock incoming note`,
  unlockIncomingNoteDesc: () =>
    t`The incoming note could not be unlocked with the provided password. Enter the correct password for the incoming note`,
  setExpiry: () => t`Set expiry`,
  unsetExpiry: () => t`Unset expiry`,
  expiryDate: () => t`Expiry date`,
  exportCsv: () => t`Export CSV`,
  importCsv: () => t`Import CSV`,
  noContent: () => t`This note is empty`,
  deleteData: () => t`Delete data`,
  failedToAttachFile: () => t`Failed to attach file`,
  unlockNoteToMergeConflicts: () => t`Unlock note to merge conflicts`,
  confirmationEmailSent: () => t`Confirmation email sent`,
  inboxAPI: () => t`Inbox API`,
  inboxAPIDesc: () =>
    t`Share things to Notesnook from anywhere using the Inbox API`,
  enableInboxAPI: () => t`Enable Inbox API`,
  enableInboxAPIDesc: () => t`Enable/Disable Inbox API`,
  manageInboxKeys: () => t`Inbox PGP Keys`,
  manageInboxKeysDesc: () =>
    t`View and edit your inbox public/private key pair`,
  disableInboxAPI: () => t`Disable Inbox API`,
  disableInboxAPIDesc: () =>
    t`Disabling will delete all your unsynced inbox items. Additionally, disabling will revoke all existing API keys, they will no longer work. Are you sure?`,
  viewAPIKeys: () => t`API Keys`,
  viewAPIKeysDesc: () => t`View and manage inbox API keys`,
  createApiKey: () => t`Create API Key`,
  keyName: () => t`Key name`,
  exampleKeyName: () => t`e.g., Todo integration`,
  expiresIn: () => t`Expires in`,
  enterKeyName: () => t`Please enter a key name`,
  apiKeyCreatedSuccessfully: () => t`API key created successfully`,
  failedToCreateApiKey: (message: string) =>
    t`Failed to create API key${message ? `: ${message}` : ""}`,
  creating: () => t`Creating...`,
  expiryOneDay: () => t`1 day`,
  expiryOneWeek: () => t`1 week`,
  expiryOneMonth: () => t`1 month`,
  expiryOneYear: () => t`1 year`,
  loadingApiKeys: () => t`Loading API keys...`,
  failedToLoadApiKeys: () => t`Failed to load API keys. Please try again.`,
  retry: () => t`Retry`,
  createFirstApiKey: () => t`Create your first api key to get started.`,
  createKey: () => t`Create Key`,
  ok: () => t`OK`,
  apiKeysLimitReached: () => t`API Keys Limit Reached`,
  apiKeysLimitReachedMessage: () =>
    t`Cannot create more than 10 api keys at a time. Please revoke some existing keys before creating new ones.`,
  authenticateToViewApiKey: () => t`Authenticate to view API key`,
  enterPasswordToViewApiKey: () =>
    t`Please enter your account password to view this API key.`,
  authenticate: () => t`Authenticate`,
  invalidPassword: () => t`Invalid password`,
  apiKeyCopiedToClipboard: () => t`API key copied to clipboard`,
  failedToCopyToClipboard: () => t`Failed to copy to clipboard`,
  revokeInboxApiKey: (name: string) => t`Revoke Inbox API Key - ${name}`,
  revokeApiKeyConfirmation: (name: string) =>
    t`Are you sure you want to revoke the key "${name}"? All inbox actions using this key will stop working immediately.`,
  apiKeyRevoked: () => t`API key revoked`,
  failedToRevokeApiKey: () => t`Failed to revoke API key`,
  lastUsedOn: () => t`Last used on`,
  neverUsed: () => t`Never used`,
  createdOn: () => t`Created on`,
  neverExpires: () => t`Never expires`,
  expired: () => t`Expired`,
  expiresOn: () => t`Expires on`,
  changingInboxPgpKeysNotice: () =>
    t`Changing Inbox PGP keys will delete all your unsynced inbox items.`,
  publicKey: () => t`Public Key:`,
  privateKey: () => t`Private Key:`,
  invalidPgpKeyPair: () =>
    t`Invalid PGP key pair. Please check your keys and try again.`,
  inboxKeysSaved: () => t`Inbox keys saved`,
  lockVaultAfter: () => t`Lock vault after`,
  lockVaultAfterDesc: () =>
    t`How long should the vault stay unlocked before automatically locking?`,
  back: () => t`Back`,
  invalidRecoveryKey: () =>
    t`Invalid recovery key. Make sure to input your account recovery key, not a 2FA recovery code.`,
  featureNotAvailable: () => t`This feature is not available on this plan.`,
  valueMustBeBetween: (min: number, max: number) =>
    t`Value must be between ${min} and ${max}`,
  pgpPrivateKeyProtected: () =>
    t`Private key is passphrase-protected. Please provide the decrypted key or a key without a passphrase.`,
  passwordRequired: () => t`Password required`,
  confirmPasswordRequired: () => t`Confirm password required`,
  enterAValidEmailAddress: () => t`Please enter a valid email address`,
  giftCodeRequired: () => t`Gift code required`,
  deleteAttachment: () => t`Delete attachment`,
  deleteAttachmentConfirm: () =>
    t`Are you sure you want to delete this attachment?`,
  attachmentDeleted: () => t`Attachment deleted`,
  titleIsRequired: () => t`Title is required`,
  nameIsRequired: () => t`Name is required.`,
  currentPasswordRequired: () => t`Current password required`,
  loginToRestoreAttachments: () => t`Login required to restore attachments`,
  loginToRestoreAttachmentsDesc: () =>
    t`You need to login to restore attachments from a backup file. [Read more](https://notesnook.com/help/faqs/login-to-restore-attachments-in-backup).
  
Continue without attachments?`,
  pleaseLoginToDownloadAttachments: () =>
    t`Please login to download attachments.`,
  publicKeyRequired: () => t`Public key required`,
  privateKeyRequired: () => t`Private key required`,
  setupInboxPgpKeysDescription: () =>
    t`Choose how you want to set up your Inbox PGP keys:`,
  setupInboxPgpKeys: () => t`Setup Inbox PGP Keys`,
  autoGenerateKeys: () => t`Auto-generate keys`,
  provideOwnKeys: () => t`Provide your own keys`,
  or: () => t`Or`,
  publicKeyLabel: () => t`Public Key`,
  privateKeyLabel: () => t`Private Key`,
  changeInboxPgpKeys: () => t`Change Inbox PGP Keys`,
  inboxKeysGenerated: () => t`Inbox keys generated`,
  authenticateToViewEditInboxPgpKeys: () =>
    t`Authenticate to view/edit Inbox PGP keys`,
  decryptionFailed: () => t`Decryption failed`,
  invalidJson: () => t`Invalid JSON`,
  validationFailed: () => t`Validation failed`,
  details: () => t`Details`,
  dateSynced: () => t`Date synced`,
  failedInboxItems: () => t`Failed inbox items`,
  failedInboxItemsDesc: () => t`View failed inbox items and error contexts`,
  noFailedInboxItems: () => t`No failed inbox items`,
  show: () => t`Show`,
  itemDeleted: () => t`Item deleted`,
  deleteAll: () => t`Delete all`,
  deleteAllFailedItemsDesc: () =>
    t`Are you sure you want to delete all failed inbox items?`,
  allItemsDeleted: () => t`All items deleted`,
  attachingFiles: () => t`Attaching files`,
  compressing: () => t`Compressing`,
  encrypting: () => t`Encrypting`,
  fileSizeLimitExceededPleaseUpgrade: () =>
    t`File size limit exceeded. Please upgrade your plan.`,
  compressionFailed: () => t`Compression failed`,
  openingLocalFile: () => t`Opening local file`,
  openingLocalFileDesc: (filePath: string) =>
    t`Are you sure you want to open this file: ${filePath}?`,
  cantOpenFileLinksInBrowsers: () =>
    t`File links cannot be opened in browsers. Please use the Notesnook desktop app.`,
  expiryDateMustBeInTheFuture: () => t`Expiry date must be in the future`,
  expiryDateCannotBeMoreThan1YearInTheFuture: () =>
    t`Expiry date cannot be more than 1 year in the future`,
  expiryDateSet: () => t`Expiry date set`,
  creationDateCannotBeAfterLastEditedDate: () =>
    t`Creation date cannot be after last edited date`,
  noteDuplicated: () => t`Note duplicated`,
  maximumReminderDate: (maxDate: string) =>
    t`Maximum reminder date is ${maxDate}`,
  invalidThemeFileFormat: () =>
    t`We couldn't load this theme. Please make sure the file is a valid JSON theme file.`,
  themeMissingRequiredFields: () =>
    t`We couldn't load this theme. The file appears to be incomplete or missing required theme properties.`,
  copyLogs: () => t`Copy logs`,
  setupInboxKeys: () => t`Setup inbox keys`,
  enterPgpPublicKey: () => t`Enter your PGP public key`,
  enterPgpPrivateKey: () => t`Enter your PGP private key`,
  expiryDateRemoved: () => t`Expiry date removed`,
  colorNotePasswordFor: (filename: string) =>
    t`Colornote password for ${filename}`,
  colorNotPasswordForDesc: () =>
    t`The password for decrypting the Colornote backup file.`,
  deleteItem: () => t`Delete item`,
  keepScreenOn: () => t`Keep screen on`,
  keepScreenOnDesc: () =>
    t`Prevent the screen from turning off while the editor is focused.`,
  clearHistory: () => t`Clear history`,
  historyCleared: () => t`Version history cleared`,
  clearHistoryConfirmation: () => t`Delete all version history for this note?`,
  deleteVersion: () => doActions.delete.version(1),
  deleteVersionConfirmation: () =>
    actionConfirmations.permanentlyDelete.version(1),
  versionDeleted: () => actions.deleted.version(1),
  offlineMode: () => t`Offline mode`,
  offlineModeDesc: () =>
    t`Using Notesnook without an account will **NOT** sync your notes across devices and could result in data loss if you lose access to your device or uninstall the app. Make sure to backup your notes regularly.`,
  alignment: () => t`Alignment`,
  whatAreMonographs: () => t`What are monographs?`,
  webTips: [
    {
      text: () =>
        t`Wrap a query in double quotes to search for an exact match.`,
      contexts: ["search"]
    },
    {
      text: () => t`Hold Ctrl/Cmd & click on multiple items to select them.`,
      contexts: ["notes", "notebooks", "tags"]
    },
    {
      text: () =>
        t`Monographs enable you to share your notes in a secure and private way.`,
      contexts: ["monographs"]
    },
    {
      text: () =>
        t`Monographs can be encrypted with a secret key and shared with anyone.`,
      contexts: ["monographs"]
    },
    {
      text: () =>
        t`Published notes can be encrypted. Which means only you and the person you share the password with can read them.`,
      contexts: ["monographs"]
    },
    {
      text: () =>
        t`You can pin frequently used Notebooks to the Side Menu to quickly access them.`,
      contexts: ["notebooks"]
    },
    {
      text: () =>
        t`A notebook can have unlimited sub-notebooks with unlimited notes.`,
      contexts: ["notebooks"]
    },
    {
      text: () =>
        t`You can multi-select notes and move them to a notebook or a sub-notebook at once.`,
      contexts: ["notebooks"]
    },
    {
      text: () => t`Mark important notes by adding them to favorites.`,
      contexts: ["notes", "favorites"]
    },
    {
      text: () =>
        t`Are you scrolling a lot to find a specific note? Pin it to the top from Note properties.`,
      contexts: ["notes"]
    },
    {
      text: () =>
        t`Pin your most important Notebooks to the top from Notebook properties.`,
      contexts: ["notebooks"]
    },
    {
      text: () =>
        t`We value your feedback so join us on Discord and share your experiences and ideas.`,
      contexts: ["notes", "notebooks", "tags"]
    },
    {
      text: () =>
        t`You can adjust how long items live in your trash from Settings -> Trash settings.`,
      contexts: ["trash"]
    }
  ],
  filterNotebooks: () => t`Filter notebooks...`,
  filterTags: () => t`Filter tags...`,
  searchForNotes: () => t`Search for notes`,
  enterNoteTitle: () => t`Enter note title`,
  enterTagTitle: () => t`Enter title of tag`,
  searchForANote: () => t`Search for a note`,
  searchForANotebook: () => t`Search for a notebook`,
  searchForATag: () => t`Search for a tag`,
  searchInAllNotes: () => t`Search in all notes`,
  columns: () => t`Columns`,
  rows: () => t`Rows`,
  totalColumns: (count: number) =>
    plural(count, { one: "# column", other: "# columns" }),
  totalRows: (count: number) =>
    plural(count, { one: "# row", other: "# rows" }),
  selectAll: () => t`Select all`,
  home: () => t`Home`,
  tags: () => t`Tags`,
  featureNotAvailableOnPlan: (feature: string) =>
    t`${feature} is not available on this plan.`,
  reachedLimitOf: (limit: number | string, feature: string) =>
    t`You have reached your limit of ${limit} ${feature}.`,
  abstract: () => t`Abstract`,
  hint: () => t`Hint`,
  info: () => t`Info`,
  success: () => t`Success`,
  example: () => t`Example`,
  failedToDownloadImage: (error: string) =>
    t`Failed to download image: ${error}.`,
  invalidStatusCode: (status: number | string) =>
    t`invalid status code ${status}`,
  imagePrivacyNotice: () =>
    t`To protect your privacy, we will download the image & add it to your attachments.`,
  embedIframeRequired: () => t`Embed code must include an iframe.`,
  embedIframeSrcRequired: () =>
    t`Embed code must include an iframe with an src attribute.`,
  invalidUrl: () => t`Please provide a valid url.`,
  invalidEmbedUrl: () => t`Please provide a valid embed url.`,
  javascriptNotSupported: () =>
    t`Embedding javascript code is not supported.`,
  browserAudioNotSupported: () =>
    t`Your browser does not support the audio element.`,
  failedToLoadWebClip: () => t`Failed to load web clip`,
  loadingWebClip: (progress: number | string) =>
    t`Loading web clip (${progress}%)`,
  anErrorOccurred: () => t`An error occurred.`,
  reportError: () => t`Report error`,
  reloadEditorBtn: () => t`Reload editor`,
  decimal: () => t`Decimal`,
  upperAlpha: () => t`Upper alpha`,
  lowerAlpha: () => t`Lower alpha`,
  upperRoman: () => t`Upper Roman`,
  lowerRoman: () => t`Lower Roman`,
  lowerGreek: () => t`Lower Greek`,
  recent: () => t`Recent`,
  lastWeek: () => t`Last week`,
  older: () => t`Older`,
  conflicted: () => t`Conflicted`,
  upcoming: () => t`Upcoming`,
  last: () => t`Last`,
  today: () => t`Today`,
  tomorrow: () => t`Tomorrow`,
  yesterday: () => t`Yesterday`,
  ongoing: () => t`Ongoing`,
  snoozedUntil: (time: string) => t`Snoozed until ${time}`,
  noteRestoredFromTrash: () => t`Note restored from trash`,
  notebookRestoredFromTrash: () => t`Notebook restored from trash`,
  colors: () => t`Colors`,
  activeReminders: () => t`Active reminders`,
  shortcuts: () => t`Shortcuts`,
  downloadingFiles: () => t`Downloading files`,
  backupInProgress: () => t`Backup in progress...`,
  preparingBackup: () => t`Preparing backup...`,
  creatingBackupZip: () => t`Creating backup zip file...`,
  legacyBackup: () => t`Legacy backup`,
  exportingNotesCount: (current: number, total: number) =>
    t`Exporting notes (${current}/${total})`,
  downloadingAttachmentsCount: (current: number) =>
    t`Downloading attachments (${current})`,
  creatingZip: () => t`Creating zip`,
  settingUpAccount: () => t`Setting up your account...`,
  accountAlmostReady: () =>
    t`Your account is almost ready, please wait...`,
  freePlanDesc: () => t`Basic features for personal use`,
  essentialPlanDesc: () =>
    t`Unlocks essential features for personal use`,
  proPlanDesc: () => t`Unlocks all features for professional use`,
  believerPlanDesc: () =>
    t`Become a believer and support the project`,
  migratingData: () => t`Migrating Data`,
  migratingDataDesc: () => t`Please wait while we migrate your data`,
  restoringAttachmentsCount: (current: number, total: number) =>
    t`Restoring attachments (${current}/${total})`,
  warn: () => t`Warn`,
  active: () => t`Active`,
  inactive: () => t`Inactive`,
  maximumFileSize: () => t`Maximum file size`,
  fullQualityImages: () => t`Full quality images`,
  blockLevelNoteLinks: () => t`Block-level note links`,
  customizableSidebar: () => t`Customizable sidebar`,
  decryptingNotes: () => t`Decrypting your notes`,
  migratingDatabaseNotice: () =>
    t`Migrating database. This might take a while.`,
  createTagTitle: (name: string) => t`Create "${name}" tag`,
  unlockFeatureToday: () => t`Unlock this feature today`,
  selectAPlan: () => t`Select a plan`,
  selectPlan: () => t`Select plan`,
  oneSubscriptionLifetimeNotes: () =>
    t`One subscription for a lifetime of notes.`,
  getStartedWithoutCompromise: () => t`Get started without compromise.`,
  coreFeaturesMinusFluff: () => t`All the core features, minus the fluff.`,
  levelUpMoreStorage: () => t`Level up with more storage.`,
  supportMissionUnlockEverything: () =>
    t`Support the mission - unlock everything.`,
  fiveYear: () => t`5 year`,
  mostPopular: () => t`Most popular`,
  youAreOnThisPlan: () => t`You are on this plan.`,
  startYourFreeTrial: () => t`Start your free trial`,
  compareAllPlans: () => t`Compare all plans`,
  trustedAndRecommendedBy200KUsers: () =>
    t`Trusted and recommended by over 200K users`,
  upgradeNow: () => t`Upgrade now`,
  dayMoneyBackGuarantee: (days: number) =>
    t`${days}-day money-back guarantee.`,
  perMonth: () => t`/ month`,
  forever: () => t`forever`,
  for1Month: () => t`for 1 month`,
  for1Year: () => t`for 1 year`,
  for5Years: () => t`for 5 years`,
  annually: () => t`annually`,
  every5Years: () => t`every 5 years`,
  validMfaCodeRequired: () =>
    t`Please provide a valid multi-factor authentication code.`,
  notebookIdCopied: () => t`Notebook ID copied to clipboard`,
  tagIdCopied: () => t`Tag ID copied to clipboard`,
  trialOngoingStartsOn: (date: string) =>
    t`Your free trial is on-going. Your subscription will start on ${date}.`,
  subExpiresOn: (date: string) => t`Your subscription will expire on ${date}.`,
  subAutoRenewsOn: (date: string) =>
    t`Your subscription will auto renew on ${date}.`,
  accountDowngradesFreeOn: (date: string) =>
    t`Your account will automatically downgrade to the Free plan on ${date}.`,
  changeSubPlan: () => t`Change your subscription plan.`,
  refundSub: () => t`Refund subscription`,
  requestingRefundForSub: () =>
    t`Requesting refund for your subscription`,
  inbox: () => t`Inbox`,
  lockAppAfter: () => t`Lock app after`,
  nMinutes: (n: number) => t`${n} minutes`,
  nMinute: (n: number) => t`${n} minute`,
  nHour: (n: number) => t`${n} hour`,
  disc: () => t`Disc`,
  circle: () => t`Circle`,
  square: () => t`Square`,
  monospace: () => t`Monospace`,
  sansSerif: () => t`Sans-serif`,
  serif: () => t`Serif`,
  failedToReportIssueOnGithub: () => t`Failed to report issue on github`,
  noteToAppendDeleted: () =>
    t`The note you are trying to append to has been deleted.`,
  noActiveSubscriptionFound: () => t`No active subscription found`,
  errorCopyingFile: () => t`Error copying file`,
  couldNotSaveTableToCsv: () => t`Could not save table to csv`,
  fileUploadNotificationPermissionDisallowed: () =>
    t`The permission to show file upload notification was disallowed by the user.`,
  subNotebooks: () => t`Sub notebooks`,
  plainText: () => t`Plain text`,
  webClip: () => t`Web clip`,
  loadingClip: () => t`Loading clip...`,
  saveNote: () => t`Save note`,
  tapToRemoveAttachment: () => t`Tap to remove an attachment.`,
  compressImagesRecommended: () => t`Compress image(s) (recommended)`,
  preparingWebClip: () => t`Preparing web clip...`,
  clipMode: () => t`Clip Mode:`,
  addMore: () => t`Add more`,
  selectANote: () => t`Select a note`,
  deletingAccount: () => t`Deleting account`,
  deletingAccountDesc: () => t`Please wait while we delete your account`,
  tableSavedToCsv: () => t`Table saved to csv`,
  wrappedYear: (year: number | string) => t`Wrapped ${year} 🎉`,
  yourYearWrapped: (year: number | string) => t`Your ${year} Wrapped`,
  letsLookBackAtYourYearInNotesnook: () =>
    t`Let's look back at your year in Notesnook`,
  youCreated: () => t`You created`,
  notesThisYear: () => t`notes this year`,
  wrappedNotesSubtext: () =>
    t`ideas, thoughts, memories. 100% encrypted. 100% yours.`,
  youWroteATotalOf: () => t`You wrote a total of`,
  wordsThisYear: () => t`words this year`,
  thatsAlmostTheLengthOfAShortNovel: () =>
    t`That's almost the length of a short novel!`,
  yourMostProductiveMonthWas: () => t`Your most productive month was`,
  yourFavoriteDayToWriteWas: () => t`Your favorite day to write was`,
  notesPerMonth: () => t`Notes per month`,
  wordsWritten: () => t`Words written`,
  funFactsOfTheYear: () => t`Fun facts of the year`,
  generatedLocallyOnDevice: () => t`Generated 100% locally on your device.`,
  shareWithFriendsButton: () => t`Share with friends`,
  // Reminders
  orderSummary: () => t`Order summary`,
  enterDiscountCode: () => t`Enter discount code`,
  addDiscount: () => t`Add discount`,
  salesTax: () => t`Sales tax`,
  discount: () => t`Discount`,
  totalForToday: () => t`Total for today`,
  freeTrialDays: (days: number) => t`${days} day free trial`,
  afterFreeTrialDays: (days: number) => t`After ${days} day free trial`,
  nextMonth: () => t`Next month`,
  nextYear: () => t`Next year`,
  billedPeriod: (period: string) => t`Billed ${period}`,
  savePercentBySwitchingPlan: (savings: string, period: string) =>
    t`Save ${savings}% by switching to ${period} plan.`,
  alreadySubscribedChangeFromSettings: () =>
    t`You already have a Notesnook subscription. You can change your plan from Settings > Subscription details.`,
  youAreAwesome: () => t`You are awesome!`,
  thankYouForSupportingPrivacy: () =>
    t`Thank you for supporting privacy! Your subscription is now active.`,
  onlyPayProratedAmount: () =>
    t`You will only pay the prorated amount for the new subscription plan`,
  planSwitchedConfirmation: (plan: string) =>
    t`Your plan will be switched to ${plan} plan. You will receive a credit for unused time on your previous subscription, and you will only pay the prorated amount for your new subscription.`,
  onlyChangePlanFromOriginalPlatform: () =>
    t`You can only change your plan from the platform you originally bought the subscription from.`,
  confirmPlanChange: () => t`Confirm plan change`,
  changingSubscriptionPlan: () => t`Changing subscription plan`,
  changingSubscriptionPlanWait: () =>
    t`Please wait while we change your subscription plan...`,
  subscriptionChangedSuccessfully: () =>
    t`Subscription changed successfully. It might take a couple of minutes for the changes to reflect in the app.`,
  planMetadataFree: () => t`Free`,
  planMetadataEssential: () => t`Essential`,
  planMetadataPro: () => t`Pro`,
  planMetadataBeliever: () => t`Believer`,
  planMetadataEducation: () => t`Education`,
  planMetadataProLegacy: () => t`Pro (legacy)`,

  // Subscription Settings
  autoRenew: () => t`Auto renew`,
  autoRenewDesc: () =>
    t`Toggle auto renew to avoid any surprise charges. If you do not turn auto renew back on, you'll be automatically downgraded to the Free plan at the end of your billing period.`,
  cancelTrialQuestion: () => t`Cancel trial?`,
  cancelTrialDesc: () =>
    t`Cancel your trial to stop all future charges permanently. You will be immediately downgraded to the Free plan.`,
  cancellingYourTrial: () => t`Cancelling your trial`,
  trialCanceled: () => t`Your trial has been canceled.`,
  requestRefundQuestion: () => t`Request refund?`,
  requestRefundDesc: () =>
    t`You will only be issued a refund if you are eligible as per our refund policy. Your account will immediately be downgraded to Basic and your funds will be transferred to your account within 24 hours.`,
  reasonForRefund: () => t`Reason for refund`,

  // Status Bar
  allChangesSynced: () => t`All changes are synced.`,
  syncingNotes: () => t`Syncing your notes...`,
  resolveConflictsAndResync: () =>
    t`Please resolve all merge conflicts and run the sync again.`,
  confirmEmailToSync: () => t`Please confirm your email to start syncing.`,
  syncFailedTryAgain: () => t`Sync failed to complete. Please try again.`,
  youAreOffline: () => t`You are offline.`,
  syncIsDisabled: () => t`Sync is disabled.`,
  clickToSync: () => t`click to sync`,
  mergeConflicts: () => t`Merge conflicts`,

  // Importer
  importUnsuccessful: () => t`Import unsuccessful`,
  failedToImportSelectedFiles: () =>
    t`We failed to import the selected files. Please try again.`,
  selectNotesAppToImportFrom: () => t`Select a notes app to import from`,
  selectNotesApp: () => t`Select notes app`,
  cantFindNotesApp: () => t`Can't find your notes app in the list?`,
  sendUsARequest: () => t`Send us a request.`,
  foundNotes: (count: number) => t`Found ${count} notes`,
  notesSuccessfullyImported: (count: number) =>
    plural(count, {
      one: `# note successfully imported.`,
      other: `# notes successfully imported.`
    }),
  processingFiles: (done: number, total: number) =>
    t`Processing ${done} of ${total} file(s)`,
  logs: () => t`Logs`,
  selectProviderFiles: (provider: string) => t`Select ${provider} files`,
  checkOutOurStepByStepGuideOn: () => t`Check out our step-by-step guide on`,
  howToImportFrom: (provider: string) => t`how to import from ${provider}.`,
  dropTheFilesHere: () => t`Drop the files here`,
  dragDropFilesHere: () =>
    t`Drag & drop files here, or click to select files`,
  onlySupportedExtensions: (extensions: string) =>
    t`Only ${extensions} files are supported.`,
  canAlsoSelectZipFiles: (extensions: string) =>
    t`You can also select .zip files containing ${extensions} files.`,
  forExampleExtensions: (examples: string) => t`For example, ${examples}`,
  filesSelected: (count: number) =>
    plural(count, {
      one: `# file selected`,
      other: `# files selected`
    }),
  freeSpaceWarning: (size: string) =>
    t`Please make sure you have at least ${size} of free space before proceeding.`,
  networkWarningForImport: () =>
    t`Please make sure you have good Internet access before proceeding. The importer may send network requests in order to download media resources such as images, files, and other attachments.`,
  startImporting: () => t`Start importing`,
  importingNotesFrom: (provider: string) =>
    t`Importing your notes from ${provider}`,
  connectYourAccount: (provider: string) =>
    t`Connect your ${provider} account`,
  sendUsABugReport: () => t`Send us a bug report`,

  // Checkout, Recovery & Navigation
  startYourJourney: () => t`Start your journey`,
  goBackToApp: () => t`Go back to app`,
  recoveryKeyRequired: () =>
    t`Recovery key is required to reset password.`,
  couldNotResetAccountPassword: () =>
    t`Could not reset account password.`,

  // Settings & Formats
  markdownFrontmatter: () => t`Markdown + Frontmatter`,
  dayFormatShort: () => t`Short (Mon, Tue)`,
  dayFormatLong: () => t`Long (Monday, Tuesday)`,
  sunday: () => t`Sunday`,
  monday: () => t`Monday`,
  disableInboxApi: () => t`Disable Inbox API`,
  disableInboxApiWarning: () =>
    t`Disabling will delete all your unsynced inbox items. Additionally, disabling will revoke all existing API keys, they will no longer work. Are you sure?`,
  createInboxApiKeyDescription: () =>
    t`The API key allows you to access NN's inbox functionality.`,
  changingReleaseTrack: () => t`Changing release track`,
  changingReleaseTrackWait: () =>
    t`Please wait while we switch to the new release track...`,
  deletingTags: () => t`Deleting tags`,
  attachmentNotFound: () => t`Attachment not found.`,
  unknown: () => t`Unknown`,
  unknownError: () => t`Unknown error.`,
  billedAt: () => t`Billed at`,
  invoice: () => t`Invoice`,
  gettingInvoice: () => t`Getting invoice`,
  mightTakeMinuteOrTwo: () => t`This might take a minute or two.`,
  keyboardShortcuts: () => t`Keyboard shortcuts`,

  // Desktop
  showApp: () => t`Show app`,
  degradedPerformanceWarning: () => t`Degraded Performance Warning`,
  arm64TranslationWarning: () =>
    t`Notesnook detected that it is running under ARM64 translation. For the best performance, please download the ARM64 build of Notesnook from our website.`,
  backupDirMigrationFailed: () => t`Backup Directory Migration Failed`,
  backupDirMigrationFailedDesc: () =>
    t`Failed to migrate backup directory. It has been reset to default.`,
  setBackupDir: () => t`Set backup directory`,
  pathNotFound: () => t`Path not found`,
  pathDoesNotExist: (path: string) => t`The path does not exist:\n${path}`,
  quickActions: () => t`Quick actions`,
  createNewNotebook: () => t`Create a new notebook`,
  addNewReminder: () => t`Add a new reminder`,

  ignore: () => t`Ignore`,
  quit: () => t`Quit`,
  confirm: () => t`Confirm`,
  generating: () => t`Generating...`,

  // Features
  features: () => t`Features`,
  defaultNotebookAndTag: () => t`Default notebook & tag`,
  recurringReminders: () => t`Recurring reminders`,
  pinNoteInNotification: () => t`Pin note in notification`,
  createNoteFromNotificationDrawer: () =>
    t`Create note from notification drawer`,
  customHomepage: () => t`Custom homepage`,
  customToolbarPreset: () => t`Custom toolbar preset`,
  disableTrashCleanup: () => t`Disable trash cleanup`,
  monographLinksAndEmbeds: () => t`Links & embeds in monographs`,
  monographAnalytics: () => t`Monographs analytics`,
  androidLauncherShortcuts: () => t`Android Launcher Shortcuts`,
  expiringNotes: () => t`Expiring notes`,
  exportTableAsCsv: () => t`Export table as CSV`,
  importCsvToTable: () => t`Import CSV to table`,
  cannotUploadFilesLargerThan: (limit: string | number) =>
    t`You cannot upload files larger than ${limit} on this plan.`,
  cannotSetDefaultNotebookOrTag: () =>
    t`You cannot set a default notebook or tag on this plan.`,
  wrongSecurityKey: () => t`Wrong security key`,
  loginSessionExpired: () =>
    t`Login session has expired. Please refresh this page and try logging in again.`,
  failedToCreateAccount: () => t`Failed to create account`,
  failedToGenerateInboxKeys: () => t`Failed to generate inbox keys`,
  publicAndPrivateKeysRequired: () =>
    t`Both public and private keys are required`,
  failedToSaveInboxKeys: () => t`Failed to save inbox keys`,
  fileCopyError: () => t`File copy error`,
  exportFailed: () => t`Export failed`,
  exportCompletedWithErrors: (errorCount: number) =>
    t`Export completed with ${errorCount} errors`,
  exportCompletedSuccessfully: () => t`Export completed with 0 errors.`,
  downloadingAttachment: (path: string) =>
    t`Downloading attachment: ${path}`,
  savingAttachment: (path: string) => t`Saving attachment: ${path}`,
  failedToExportAttachment: (path: string, message: string) =>
    t`Failed to export attachment: ${path}. ${message}`,
  exportingNotePath: (path: string) => t`Exporting note: ${path}`,
  focusedOnPrivacy: () => t`Focused on privacy`,
  focusedOnPrivacyDesc: () =>
    t`Everything you do in Notesnook stays private. We use XChaCha20-Poly1305-IETF and Argon2 to encrypt your notes.`,
  zeroAdsAndZeroTrackers: () => t`Zero ads & zero trackers`,
  onDeviceEncryption: () => t`On device encryption`,
  secureAppLockForAll: () => t`Secure app lock for all`,
  endToEndEncrypted100: () => t`100% end-to-end encrypted`,
  privateVaultForNotes: () => t`Private vault for notes`,
  instantSyncing: () => t`Instant syncing`,
  instantSyncingDesc: () =>
    t`Seamlessly work from anywhere. Every change is synced instantly everywhere.`,
  syncToUnlimitedDevices: () => t`Sync to unlimited devices`,
  realTimeEditorSync: () => t`Real-time editor sync`,
  granularSyncControls: () => t`Granular sync controls*`,
  granularSyncControlsDesc: () =>
    t`* Disable sync completely, turn off auto sync, or just disable real-time editor sync.`,
  crossPlatform100: () => t`100% cross platform`,
  crossPlatform100Desc: () =>
    t`Notesnook is available on all major platforms — for everyone.`,
  twoFactorAuthFeatureDesc: () =>
    t`Improve your account security & prevent intruders from accessing your notes using 2FA.`,
  twoFactorEmail: () => t`Email*`,
  authenticatorApp: () => t`Authenticator app`,
  twoFactorSms: () => t`SMS`,
  twoFactorEmailDesc: () =>
    t`* 2FA via email is enabled by default for all users`,
  attachFilesAndImages: () => t`Attach files & images`,
  attachFilesAndImagesDesc: () =>
    t`Add your documents, PDFs, images and videos, and keep them safe and organized.`,
  bulletproofEncryption: () => t`Bulletproof encryption`,
  highQuality4kImages: () => t`High quality 4K images`,
  unlimitedStorage: () => t`Unlimited storage`,
  upto500MbPerFile: () => t`Upto 500 MB per file`,
  allFileTypesSupported: () => t`All file types supported`,
  noLimitOnNotes: () => t`No limit on notes`,
  noLimitOnNotesDesc: () =>
    t`We don't have nonsense like blocks and whatnot. You can create as many notes as you want — no limits.`,
  crossPlatformReminders: () => t`Cross-platform reminders`,
  crossPlatformRemindersDesc: () =>
    t`Stay updated on all your upcoming tasks with reminders.`,
  oneTimeReminders: () => t`One-time reminders`,
  recurringRemindersDailyWeeklyMonthly: () =>
    t`Daily, monthly & weekly recurring reminders`,
  safePublishingToInternet: () => t`Safe publishing to the Internet`,
  safePublishingToInternetDesc: () =>
    t`Publishing is nothing new but we offer fully encrypted, anonymous publishing. Take any note & share it with the world.`,
  anonymousPublishing: () => t`Anonymous publishing`,
  selfDestructableNotes: () => t`Self destructable notes`,
  organizeYourselfBestWay: () => t`Organize yourself in the best way`,
  organizeYourselfBestWayDesc: () =>
    t`We offer multiple ways to keep you organized. The only limit is your imagination.`,
  unlimitedNotebooksAsterisk: () => t`Unlimited notebooks*`,
  colorsAndTagsAsterisk: () => t`Colors & tags*`,
  sideMenuShortcuts: () => t`Side menu shortcuts`,
  pinsAndFavorites: () => t`Pins & favorites`,
  unlimitedNotebooksInfo: () =>
    t`* Free users can only create 20 notebooks and 5 tags.`,
  richToolsForRichEditing: () => t`Rich tools for rich editing`,
  richToolsForRichEditingDesc: () =>
    t`Having the right tool at the right time is crucial for note taking. Lists, tables, codeblocks — you name it, we have it.`,
  listsAndTables: () => t`Lists & tables`,
  imagesAndEmbeds: () => t`Images & embeds`,
  checklists: () => t`Checklists`,
  customizableToolbarAsterisk: () => t`Customizable toolbar*`,
  customizableToolbarInfo: () =>
    t`* Free users can only choose from pre-defined toolbar presets.`,
  exportAndTakeNotesAnywhere: () => t`Export and take your notes anywhere`,
  exportAndTakeNotesAnywhereDesc: () =>
    t`You own your notes, not us. No proprietary formats. No vendor lock in. No waiting for hours to download your notes.`,
  exportAsMarkdown: () => t`Export as Markdown`,
  exportAsPdf: () => t`Export as PDF`,
  exportAsHtml: () => t`Export as HTML`,
  exportAsText: () => t`Export as text`,
  bulkExports: () => t`Bulk exports`,
  backupAndKeepNotesSafe: () => t`Backup & keep your notes safe`,
  backupAndKeepNotesSafeDesc: () =>
    t`Do not worry about losing your data. Turn on automatic backups on weekly or daily basis.`,
  autoBackupsMonthlyWeeklyDaily: () =>
    t`Automatic monthly, weekly & daily backups`,
  personalizeMakeNotesnookYourOwn: () =>
    t`Personalize & make Notesnook your own`,
  personalizeMakeNotesnookYourOwnDesc: () =>
    t`Change app themes to match your style. Custom themes are coming soon.`,
  themes10Plus: () => t`10+ themes`,
  automaticDarkMode: () => t`Automatic dark mode`,
  changeDefaultHomePage: () => t`Change default home page`,
  applyingCouponCode: () => t`Applying coupon code...`,
  loadingCheckoutPleaseWait: () => t`Loading checkout. Please wait...`,
  finalStepMakePayment: () => t`Final step, make the payment.`,
  oneStepAwayFromUnlocking: () =>
    t`You are one step away from unlocking the full potential of Notesnook.`,
  summary: () => t`Summary`,
  planWithTitle: (planTitle: string) => t`${planTitle} plan`,
  notFound: () => t`Not found`,
  youHaveNotBeenBilledYet: () => t`You have not been billed yet.`,
  claimPromotion: {
    0: () => t`Click here`,
    1: () => t`to directly claim the promotion.`
  },
  wrappedTitle: (year: number | string) => t`🎉 Wrapped ${year}`,
  huzzah: () => t`Huzzah!`,
  notice: () => t`Notice`,
  notice2: () => t`Notice 2`,
  betaWarningDescription: {
    0: () =>
      t`This is the beta version and as such will contain bugs. Things are expected to break but should be generally stable. Please use the`,
    1: () => t`button to report all bugs. Thank you!`
  },
  betaSwitchingWarning: () =>
    t`Switching between beta & stable versions can cause weird issues including data loss. It is recommended that you do not use both simultaneously. You can switch once the beta version enters stable.`,

  couldNotUnwrapKey: () => t`Could not unwrap key.`,
  passwordIsRequired: () => t`Password is required.`,
  wrongPassword: () => t`Wrong password.`
};

