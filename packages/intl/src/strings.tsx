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
import { I18n } from "@lingui/core";
import { plural, select, t } from "@lingui/macro";

export const strings = {
  done: () => t`Done`,
  verifyItsYou: () => t`Please verify it's you`,
  unlockNotes: () => t`Unlock your notes`,
  note: () => t`Note`,
  notes: (count: number) =>
    plural(count, {
      one: "# note",
      other: "# notes",
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore
      _0: "No notes"
    }),
  downloading: () => t`Downloading`,
  uploading: () => t`Uploading`,
  networkProgress: (type: "upload" | "download") =>
    select(type, {
      upload: "Uploading",
      download: "Downloading",
      other: "Loading"
    }),
  tapToCancel: () => t`Tap to cancel`,
  attachmentsDownloadFailed: (count: number) =>
    plural(count, {
      one: "Failed to download attachment",
      other: "Failed to download # attachments"
    }),
  attachmentsDownloaded: (count: number, total: number, path: string) =>
    plural(count, {
      one: `Attachment downloaded at ${path}`,
      other: `#/${total} attachments downloaded as a zip file at ${path}`
    }),
  downloadAllAttachmentsConfirmation: (count: number) =>
    plural(count, {
      one: "Are you sure you want to download all attachments of this note?",
      other: "Are you sure you want to download all attachments?"
    }),
  noDownloads: () => t`No downloads in progress.`,
  noAttachments: () => t`No attachments.`,
  attachmentsEncryptedNote: () => t`All attachments are end-to-end encrypted.`,
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
      t`You also agree to recieve marketing emails from us which you can opt-out of from app settings.`
  },
  alreadyHaveAccount: () => t`Already have an account?`,
  login: () => t`Login`,
  "2fa": () => t`Two factor authentication`,
  select2faMethod: () => t`Select method for two-factor authentication`,
  select2faCodeHelpText: () => t`Select how you would like to recieve the code`,
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
  deleteVault: () => t`Delete`,
  clearVault: () => t`Clear`,
  enable: () => t`Enable`,
  revoke: () => t`Revoke`,
  change: () => t`Change`,
  delete: () => t`Delete`,
  share: () => t`Share`,
  open: () => t`Open`,
  unlock: () => t`Unlock`,
  create: () => t`Create`,
  lock: () => t`Lock`,
  analyticsPermissionText: {
    0: () => t`Help improve Notesnook by sending completely anonymized`,
    1: () => t`private analytics and bug reports.`
  },
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
      | "dateModifed"
      | "dateUploaded"
      | "dateDeleted"
  ) =>
    select(key, {
      dateCreated: "Created at",
      dateEdited: "Last edited at",
      dateModifed: "Last modified at",
      dateUploaded: "Uploaded at",
      dateDeleted: "Deleted at",
      other: key
    }),
  noNotePropertiesNotice: (i18n: I18n) =>
    t(i18n)`Start writing to save your note.`,
  noteSyncedNoticeHeading: (i18n: I18n) => t(i18n)`Encrypted and synced`,
  noteSyncedNoticeDesc: (type: string, i18n: I18n) =>
    t(i18n)`No one can view this ${type} except you.`,
  emptyPlaceholders: (type: "notebook" | "tag" | "note") =>
    select(type, {
      other: "This list is empty",
      notebook: "No notebooks",
      tag: "No tags",
      note: "No notes"
    }),
  untitledNote: () => t`Untitled`,
  newNote: () => t`New note`,
  exportingNotes: (status?: string) =>
    t`${status ? status : "Exporting notes"}... Please wait `,
  exportSuccessHeading: (count: number) =>
    plural(count, {
      one: "Note exported",
      other: "# notes exported"
    }),
  exportSuccessDesc: (path: string) =>
    t`Notes exported as ${path} successfully`,
  issueCreatedHeading: () => t`Issue created`,
  issueCreatedDesc: {
    0: () => t`You can track your issue at `,
    1: () =>
      t`Please note that we will respond to your issue on the given link. We recommend that you save it.`
  },
  issueNotice: {
    0: () => t`The information above will be publically available at`,
    1: () =>
      t`If you want to ask something in general or need some assistance, we would suggest that you`,
    2: () => t`join our community on Discord.`
  },
  linkNoteEmptyBlock: () => t`(Empty block)`,
  linkNoteSelectedNote: () => t`SELECTED NOTE`,
  tapToDeselect: () => t`Tap to deselect`,
  linkNoteToSection: () => t`LINK TO A SECTION`,
  migrationProgress: (progress?: {
    total: number;
    collection: string;
    current: number;
  }) =>
    t`Migrating ${progress ? `${progress?.collection}` : null} ${
      progress ? `(${progress.current}/${progress.total}) ` : null
    }... please wait`,
  migrationError: () =>
    t`An error occurred while migrating your data. You can logout of your account and try to relogin. However this is not recommended as it may result in some data loss if your data was not synced.`,
  migrationAppReset: () =>
    t`App data has been cleared. Kindly relaunch the app to login again.`,
  notebooks: () => t`NOTEBOOKS`,
  syncingHeading: () => t`Syncing your data`,
  syncingDesc: () => t`Please wait while we sync all your data.`,
  downloadingAttachments: () => t`Downloading attachments`,
  pleaseWait: () => t`Please wait`,
  publishedAt: () => t`Published at`,
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
  dataTypes: {
    note: () => t`note`,
    notebook: () => t`notebook`,
    tag: () => t`tag`,
    reminder: () => t`reminder`,
    color: () => t`color`,
    attachment: () => t`attachment`
  },
  dataTypesCamelCase: {
    note: () => t`Note`,
    notebook: () => t`Notebook`,
    tag: () => t`Tag`,
    reminder: () => t`Reminder`,
    color: () => t`Color`,
    attachment: () => t`Attachment`
  },
  dataTypesPlural: {
    note: () => t`notes`,
    notebook: () => t`notebooks`,
    tag: () => t`tags`,
    reminder: () => t`reminders`,
    color: () => t`colors`,
    attachment: () => t`attachments`
  },
  dataTypesPluralCamelCase: {
    note: () => t`Notes`,
    notebook: () => t`Notebooks`,
    tag: () => t`Tags`,
    reminder: () => t`Reminders`,
    color: () => t`Colors`,
    attachment: () => t`Attachments`,
    favorite: () => t`Favorites`,
    monograph: () => t`Monographs`
  },
  addItem: (referenceType: string) =>
    t`Add a ${strings.dataTypes[
      referenceType as keyof typeof strings.dataTypes
    ]()}`,
  reminderRepeatStrings: {
    day: (date: string) => t`Repeats daily at ${date}`,
    week: {
      daily: (date: string) => t`The reminder will repeat daily at ${date}.`,
      selectDays: () => t`Select day of the week to repeat the reminder.`
    },
    year: (date: string) => t`The reminder will repeat every year on ${date}.`,
    month: {
      selectDays: () => t`Select day of the month to repeat the reminder.`
    },
    repeats: (freq: number, mode: string, selectedDays: string, date: string) =>
      plural(freq, {
        one: `Repeats every ${strings.reminderRepeatMode[
          mode as keyof typeof strings.reminderRepeatMode
        ]()} on ${selectedDays} at ${date}`,
        other: `Repeats every ${freq} ${strings.reminderRepeatMode[
          mode as keyof typeof strings.reminderRepeatMode
        ]()} every ${selectedDays} at ${date}`
      })
  },
  reminderRepeatMode: {
    day: () => t`day`,
    week: () => t`week`,
    month: () => t`month`,
    year: () => t`year`
  },
  remindMeIn: () => t`Remind me in`,
  referencedIn: () => t`REFERENCED IN`,
  restoreSelectFolder: () =>
    t`Select the folder that includes your backup files to list them here.`,
  noBackupsFound: () => t`No backups found`,
  restoring: () => t`Restoring`,
  checkNewVersion: () => t`Checking for new version`,
  noUpdates: () => t`No updates available`,
  updateAvailable: () => t`Update available`,
  versionReleased: (version: string, type: "github" | "store") =>
    select(type, {
      github: `v${version} has been released on GitHub`,
      store: `v${version} has been released`,
      other: `v${version} has been released`
    }),
  readReleaseNotes: () => t`Read full release notes on Github`,
  beta: () => t`BETA`,
  settings: () => t`Settings`,
  notLoggedIn: () => t`Not logged in`,
  never: () => t`Never`,
  syncing: () => t`Syncing`,
  syncFailed: () => t`Sync failed`,
  synced: () => t`Synced`,
  offline: () => t`Offline`,
  editorFailedToLoad: () =>
    t`If the editor fails to load even after reloading. Try restarting the app.`,
  gettingInformation: () => t`Getting information`,
  enterSixDigitCode: () => t`Enter 6 digit code`,
  gettingRecoveryCodes: () => t`Getting recovery codes`,
  protectNotes: () => t`Protect your notes`,
  protectNotesDesc: () => t`Choose how you want to secure your notes locally.`,
  loggingOut: () => t`Logging out`,
  loggingOutDesc: () => t`Please wait while we log you out.`,
  by: () => t`By`,
  noResultsForSearch: (query: string) => t`No results found for "${query}"`,
  noThemesFound: () => t`No themes found`,
  errorLoadingThemes: () => t`Error loading themes`,
  version: () => t`Version`,
  visitHomePage: () => t`Visit homepage`,
  tapToApplyAgain: () => t`Tap to apply again`,
  titleFormattingGuide: () => t`Use the following key to format the title:

$date$: Current date.
$time$: Current time.
$timestamp$: Full date and time without any spaces or other symbols.
(e.g 202305261253).
$count$: Number of notes + 1.
$headline$: Use starting line of the note as title.`,
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

  createVault: () => t`Create Vault`,
  vaultFingerprintUnlock: () => t`Vault Fingerprint Unlock`,
  revokeVaultFingerprintUnlock: () => t`Revoke Vault Fingerprint Unlock`,
  changeVaultPassword: () => t`Change Vault Password`,
  deleteNote: () => t`Delete note`,
  shareNote: () => t`Share note`,
  copyNote: () => t`Copy note`,
  goToEditor: () => t`Unlock note`,
  lockNote: () => t`Lock note`,
  applyChanges: () => t`Apply changes`,
  noteHistory: () => t`Note history`,
  selectNotebooks: () => t`Select notebooks`,
  selectNotebooksDesc: () => t`Select notebooks you want to add note(s) to.`,
  enableMultiSelect: () => t`Tap and hold to enable multi-select.`,
  changeEmail: () => t`Change email address`,
  changeEmailDesc: () =>
    t`Your account email will be changed without affecting your subscription or any other settings.`,
  export: () => t`Export`,
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
  addNotesToNotebook: (title: string) => t`Add notes to ${title}`,
  publish: () => t`Publish`,
  publishDesc: () =>
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
    downloading: () => t`Downloading`,
    downloaded: () => t`Downloaded`,
    download: () => t`Download`,
    upload: () => t`Upload`,
    uploaded: () => t`Uploaded`,
    uploading: () => t`Uploading`,
    reupload: () => t`Reupload`,
    downloadSuccess: () => t`Download successful`,
    fileDownloaded: (name?: string) => t`${name || "File"} downloaded`,
    dowloadCancelled: () => t`Download cancelled`
  },
  createYourAccount: () => t`Create your {"\n"}account`,
  pinned: () => t`Pinned`,
  editNotebook: () => t`Edit notebook`,
  newNotebook: () => t`New notebook`,
  tabs: () => t`Tabs`,
  add: () => t`Add`,
  newVersion: () => t`New version`,
  editReminder: () => t`Edit reminder`,
  newReminder: () => t`New reminder`,
  sortBy: () => t`Sort by`,
  groupBy: () => t`Group by`,
  toc: () => t`Table of contents`,
  appliedDark: () => t`Applied as dark theme`,
  appliedLight: () => t`Applied as light theme`,
  basic: () => t`Basic`,
  loginToYourAccount: () => t`Login to your {"\n"}account`,
  continue: () => t`Continue`,
  unlockWithBiometrics: () => t`Unlock with biometrics`,
  fileCheck: () => t`Run file check`,
  rename: () => t`Rename`,
  no: () => t`No`,
  yes: () => t`Yes`,
  cancel: () => t`Cancel`,
  skip: () => t`Skip`,
  changePasswordConfirm: () => t`"I understand, change my password"`,
  next: () => t`Next`,
  forgotPassword: () => t`Forgot password?`,
  cancelLogin: "Cancel login",
  logoutFromDevice: () => t`Logout from this device`,
  useAccountPassword: () => t`Use account password`,
  addColor: () => t`Add color`,
  unlockNote: () => t`Unlock note`,
  deleteAllNotes: () => t`Delete all notes`,
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
  save: () => t`Save`,
  verify: () => t`Verify`,
  newTab: () => t`New tab`,
  openFileLocation: () => t`Open file location`,
  exportAgain: () => t`Export again`,
  openIssue: () => t`Open issue`,
  submit: () => t`Submit`,
  createLink: () => t`Create link`,
  logoutAnClearData: () => t`Logout and clear data`,
  saveAndContinue: () => t`Save and continue`,
  moveToTop: () => t`Move to top`,
  moveSelectedNotes: () => t`Move selected notes`,
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
  reminderModes: {
    Repeat: () => t`Repeat`,
    Once: () => t`Once`,
    Permanent: () => t`Permanent`
  },
  recurringModes: {
    Daily: () => t`Daily`,
    Weekly: () => t`Weekly`,
    Monthly: () => t`Monthly`,
    Yearly: () => t`Yearly`
  },
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
  reminderNotificationModes: {
    Silent: () => t`Silent`,
    Vibrate: () => t`Vibrate`,
    Urgent: () => t`Urgent`
  },
  selectBackupsFolder: () => t`Select backups folder`,
  oldNew: () => t`Old - new`,
  newOld: () => t`New - old`,
  latestFirst: () => t`Latest first`,
  earliestFirst: () => t`Earliest first`,
  aToZ: () => t`A to Z`,
  zToA: () => t`Z to A`,
  title: () => t`Title`,
  sortByStrings: {
    dateModified: () => t`Date modified`,
    dateEdited: () => t`Date edited`,
    dateCreated: () => t`Date created`,
    title: () => t`Title`,
    dueDate: () => t`Due date`
  },
  groupByStrings: {
    default: () => t`Default`,
    None: () => t`None`,
    abc: () => t`Abc`,
    year: () => t`Year`,
    week: () => t`Week`,
    month: () => t`Month`
  },
  downloadUpdate: () => t`Download update`,
  stopReordering: () => t`Tap to stop reordering`,
  removeShortcut: () => t`Remove shortcut`,
  tip: () => t`TIP`,
  neverShowAgain: () => t`Never show again`,
  skipIntroduction: () => t`Skip introduction`,
  reloadEditor: () => t`Taking too long? Reload editor`,
  copy: () => t`Copy`,
  resendCode: (seconds: any) => t`Resend code (${seconds})`,
  change2faMethod: () => t`Change 2FA method`,
  copyCodes: () => t`Copy codes`,
  saveToFile: () => t`Save to file`,
  secondary2faMethod: () => t`Setup secondary 2FA method`,
  confirmEmail: () => t`Confirm email`,
  manageSubDesktop: () => t`Manage subscription on desktop`,
  resubFromPlaystore: () => t`Resubscribe from Playstore`,
  resubToPro: () => t`Resubscribe to Pro`,
  getPro: () => t`Get Pro`,
  monthShort: () => t`mo`,
  yearShort: () => t`yr`,
  subscriptionProviderInfo: {
    1: {
      type: "iOS",
      title: () => t`Subscribed on iOS`,
      desc: () =>
        t`You subscribed to Notesnook Pro on iOS using Apple In App Purchase. You can cancel anytime with your iTunes Account settings.`,
      icon: "ios"
    },
    2: {
      type: "Android",
      title: () => t`Subscribed on Android`,
      desc: () =>
        t`You subscribed to Notesnook Pro on Android Phone/Tablet using Google In App Purchase.`,
      icon: "android"
    },
    3: {
      type: "Web",
      title: () => t`Subscribed on Web`,
      desc: () => t`You subscribed to Notesnook Pro on the Web/Desktop App.`,
      icon: "web"
    }
  },
  dark: () => t`Dark`,
  light: () => t`Light`,
  all: () => t`All`,
  loadFromFile: () => t`Load from file`,
  setAsDarkTheme: () => t`Set as dark theme`,
  setAsLightTheme: () => t`Set as light theme`,
  createAGroup: () => t`Create a group`,
  fileCheckFailed: (reason: string) =>
    t`File check failed: ${reason} Try reuploading the file to fix the issue.`,
  changePasswordNotice: () =>
    t`Changing password is an irreversible process. You will be logged out from all your devices. Please make sure you do not close the app while your password is changing and have good internet connection.`,
  changePasswordNotice2: () =>
    t`Once your password is changed, please make sure to save the new account recovery key`,
  sideMenuNotice: () => t`Add shortcuts for notebooks and tags here.`,
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
    all: () => t`All`,
    image: () => t`Images`,
    video: () => t`Videos`,
    audio: () => t`Audio`,
    document: () => t`Documents`,
    orphaned: () => t`Orphaned`,
    errors: () => t`Errors`
  },
  emailNotConfirmed: () => t`Email not confirmed`,
  emailNotConfirmedDesc: () =>
    t`Your email is not confirmed. Please confirm your email address to change account password.`,
  allFieldsRequired: () => t`All fields are required`,
  allFieldsRequiredDesc: () => t`Please fill all the fields to continue.`,
  backupFailed: () => t`Backup failed`,
  passwordChangedSuccessfully: () => t`Password changed successfully`,
  passwordChangeFailed: () => t`Password change failed`,
  emailRequired: () => t`Email is required`,
  recoveryEmailFailed: () => t`Failed to send recovery email`,
  logoutDesc: () =>
    t`Are you sure you want to logout from this device? Any unsynced changes will be lost.`,
  logout: () => t`Logout`,
  signupFailed: () => t`Signup failed`,
  loginFailed: () => t`Login failed`,
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
  zipping: () => t`Zipping`,
  savingZipFile: () => t`Saving zip file`,
  failedToZipFiles: () => t`Failed to zip files`,
  fileVerificationFailed: () => t`Uploaded file verification failed.`,
  fileLengthError: () =>
    t`File length is 0. Please upload this file again from the attachment manager.`,
  fileLengthMismatch: (expectedSize: number, currentSize: number) =>
    t`File length mismatch. Expected ${expectedSize} but got ${currentSize} bytes. Please upload this file again from the attachment manager.`,
  failedToResolvedDownloadUrl: () => t`Failed to resolve download url`,
  fileSize: () => `File size`,
  donwloadStarted: () => t`Download started... Please wait`,
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
      user: "@andrewsayer on Twitter"
    }
  ],
  shortcutCreated: () => t`Shortcut created`,
  notebookRestored: () => t`Notebook restored`,
  restoreNotebook: () => t`Restore notebook`,
  permanentlyDeletedNotebook: () => t`Permanently deleted notebook`,
  noteRestoredFromHistory: () => t`Note restored from history`,
  noteRestored: () => t`Note restored`,
  deleteNoteConfirmation: () =>
    t`Are you sure you want to delete this note permanently?`,
  noteDeleted: () => t`Note deleted`,
  restored: () => t`Restored successfully`,
  deleteItems: (type: string, count: number) =>
    plural(count, {
      one: `Delete ${strings.dataTypes[
        type as keyof typeof strings.dataTypes
      ]()}`,
      other: `Delete ${strings.dataTypesPlural[
        type as keyof typeof strings.dataTypes
      ]()}`
    }),
  deleteItemsConfirmation: (type: string, count: number) =>
    plural(count, {
      one: `Are you sure you want to delete this ${strings.dataTypes[
        type as keyof typeof strings.dataTypes
      ]()} permanently?`,
      other: `Are you sure you want to delete these ${strings.dataTypesPlural[
        type as keyof typeof strings.dataTypes
      ]()} permanently?`
    }),
  manageTags: () => t`Manage tags`,
  linkNotebook: () => t`Link to notebook`,
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
  monographUrlCopied: () => t`Monograph URL copied`,
  recoveryKeySaved: () => t`Did you save recovery key?`,
  recoveryKeySavedDesc: () =>
    t`Please make sure you have saved the recovery key. Tap one more time to confirm.`,
  recoveryKeyQRCodeSaved: () => t`Recovery key QR code saved`,
  recoveryKeyTextFileSaved: () => t`Recovery key text file saved`,
  recoveryKeyCopied: () => t`Recovery key copied`,
  timeShort: {
    second: () => t`sec`,
    minute: () => t`min`,
    hour: () => t`hr`
  },
  backupEncrypted: () => t`Backup is encrypted`,
  password: () => t`Password`,
  renameTag: () => t`Rename tag`,
  renameColor: () => t`Rename color`,
  name: () => t`Name`,
  unlockToDelete: () => t`Unlock note to delete it`,
  backupRestored: () => t`Backup restored`,
  restoreFailed: () => t`Restore failed`,
  itemDeleted: (count: number, type: string) =>
    plural(count, {
      one: `1 ${strings.dataTypesCamelCase[
        type as keyof typeof strings.dataTypesCamelCase
      ]()} deleted`,
      other: `# ${strings.dataTypes[
        type as keyof typeof strings.dataTypes
      ]()} deleted`
    }),
  reorder: () => t`Reorder`,
  turnOffReminder: () => t`Turn off reminder`,
  turnOnReminder: () => t`Turn on reminder`,
  addShortcut: () => t`Add shortcut`,
  addNotebook: () => t`Add notebook`,
  removeAsDefault: () => t`Remove as default`,
  setAsDefault: () => t`Set as default`,
  moveNotes: () => t`Move notes`,
  unpin: () => t`Unpin`,
  pin: () => t`Pin`,
  lockedNotesPinnedFailed: () => t`Locked notes cannot be pinned`,
  loginRequired: () => t`Login required`,
  confirmEmailToPublish: () => t`Confirm email to publish note`,
  lockedNotesPublishFailed: () => t`Locked notes cannot be published`,
  notePreparingForShare: () => t`Preparing note for share`,
  removeFromNotebook: () => t`Remove from notebook`,
  attachments: () => t`Attachments`,
  history: () => t`History`,
  copyLink: () => t`Copy link`,
  linkCopied: () => t`Link copied`,
  readOnly: () => t`Read only`,
  syncOff: () => t`Sync off`,
  duplicate: () => t`Duplicate`,
  remindMe: () => t`Remind me`,
  published: () => t`Published`,
  unpinFromNotifications: () => t`Unpin from notifications`,
  pinToNotifications: () => t`Pin to notifications`,
  linkNotebooks: () => t`Link notebooks`,
  addTags: () => t`Add tags`,
  references: () => t`References`,
  moveNotebookFix: () => t`Move notebook`,
  failedToSubscribe: () => t`Failed to subscribe`,
  createNewNote: () => t`Create a new note`,
  monographs: () => t`Monographs`,
  encryptingAttachment: () => t`Encrypting attachment`,
  encryptingAttachmentDesc: (name: string) =>
    t`Please wait while we encrypt ${name} for upload.`,
  fileTooLarge: () => t`File too large`,
  fileTooLargeDesc: (sizeInMB: number) =>
    t`File size should be less than ${sizeInMB}MB`,
  failToOpen: () => t`Failed to open`,
  fileMismatch: () => t`File mismatch`,
  noNoteProperties: () => t`Start writing to create a new note`,
  createNoteFirst: () => t`Create a note first`,
  noteLockedSave: () => t`This note is locked. Unlock note to save changes`,
  saveFailedVaultLocked: () => t`Save failed. Vault is locked`,
  yourFavorites: () => t`Your favorites`,
  yourNotes: () => t`Your notes`,
  yourTags: () => t`Your tags`,
  yourNotebooks: () => t`Your notebooks`,
  yourReminders: () => t`Your reminders`,
  yourMonographs: () => t`Your monographs`,
  favoritesEmpty: () => t`You have not favorited any notes yet`,
  notesEmpty: () => t`You have not created any notes yet`,
  tagsEmpty: () => t`You have not added any tags yet`,
  notebooksEmpty: () => t`You have not added any notebooks yet`,
  remindersEmpty: () => t`You have not set any reminders yet`,
  monographsEmpty: () => t`You have not published any monographs yet`,
  loadingFavorites: () => t`Loading your favorites`,
  loadingNotes: () => t`Loading your notes`,
  loadingTags: () => t`Loading your tags`,
  loadingNotebooks: () => t`Loading your notebooks`,
  loadingReminders: () => t`Loading your reminders`,
  loadingMonographs: () => t`Loading your monographs`,
  addFirstNote: () => t`Add your first note`,
  addFirstNotebook: () => t`Add your first notebook`,
  setReminder: () => t`Set a reminder`,
  learnMoreMonographs: () => t`Learn more about Monographs`,
  mfaAuthAppTitle: () => t`Setup using an Authenticator app`,
  mfaAuthAppDesc: () => t`Use an authenticator app to generate 2FA codes.`,
  mfaEmailTitle: () => t`Setup using email`,
  mfaEmailDesc: () =>
    t`Notesnook will send you a 2FA code on your email when prompted`,
  mfaSmsTitle: () => t`Setup using SMS`,
  mfaSmsDesc: () =>
    t`Notesnook will send you an SMS with a 2FA code when prompted`,
  codesCopied: () => t`Recovery codes copied!`,
  resendCodeWait: () => t`Please wait before requesting a new code`,
  phoneNumberNotEntered: () => t`Phone number not entered`,
  "2faCodeSentVia": (method: string) => t`2FA code sent via ${method}`,
  errorSend2fa: () => t`Error sending 2FA code`,
  codesSaved: () => t`Recovery codes saved!`,
  logsCopied: () => t`Debug log copied!`,
  logsDownloaded: () => t`Debug logs downloaded`,
  clearLogs: () => t`Clear logs`,
  clear: () => t`Clear`,
  clearLogsConfirmation: (key: string) =>
    t`Are you sure you want to clear all logs from ${key}?`,
  enterPasswordDesc: () => t`Please enter your password to continue`,
  verifyFailed: () => t`Verification failed`,
  enterApplockPassword: () => t`Enter app lock password`,
  enterApplockPasswordDesc: () =>
    t`Please enter your app lock password to continue`,
  enterApplockPin: () => t`Enter app lock pin`,
  enterApplockPinDesc: () => t`Please enter your app lock pin to continue`,
  account: () => t`account`,
  subscribeToPro: () => t`Subscribe to Pro`,
  trialStarted: () => t`Your free trial has started`,
  subDetails: () => t`Subscription details`,
  signedUpOn: (date: string) => t`Signed up on ${date}`,
  trialEndsOn: (date: string) => t`Your free trial ends on ${date}`,
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
    t`All your data will be removed permanently. Make sure you have saved backup of your notes. This action is IRREVERSIBLE.`,
  enterAccountPassword: () => t`Enter account password`,
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
    t`Use this if changes from other devices are not appearing on this device. This will overwrite the data on this device with the latest data from the server.\n\nThis must only be used for troubleshooting. Using it regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`,
  forceSyncNotice: () =>
    `This must only be used for troubleshooting. Using this regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`,
  forcePushChanges: () => t`Force push changes`,
  forcePushChangesDesc: () =>
    t`Use this if changes made on this device are not appearing on other devices. This will overwrite the data on the server with the data from this device.\n\nThis must only be used for troubleshooting. Using it regularly for sync is not recommended and will lead to unexpected data loss and other issues. If you are having persistent issues with sync, please report them to us at support@streetwriters.co.`,
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
  homepage: () => t`Homepage`,
  homepageDesc: () => t`Default screen to open on app launch`,
  dateFormat: () => t`Date format`,
  dateFormatDesc: () => t`Choose how dates are displayed in the app`,
  timeFormat: () => t`Time format`,
  timeFormatDesc: () => t`Choose how time is displayed in the app`,
  clearTrashInterval: () => t`Clear trash interval`,
  clearTrashIntervalDesc: () =>
    t`Automatically clear trash after a certain period of time`,
  clearDefaultNotebook: () => t`Clear default notebook`,
  clearDefaultNotebookDesc: () => t`Newly created notes will be uncategorized`,
  editor: () => t`Editor`,
  editorDesc: () => t`Customize the note editor`,
  customizeToolbar: () => t`Customize toolbar`,
  customizeToolbarDesc: () => t`Customize the toolbar in the note editor`,
  resetToolbar: () => t`Reset toolbar`,
  resetToolbarDesc: () => t`Reset the toolbar to default settings`,
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
  telemetry: () => t`Telemetry`,
  telemetryDesc: () =>
    t`Contribute towards a better Notesnook. All tracking information is anonymous.`,
  marketingEmails: () => t`Marketing emails`,
  marketingEmailsDesc: () =>
    t`We will send you occasional promotional offers & product updates on your email (sent once every month).`,
  corsBypass: () => t`CORS bypass`,
  corsBypassDesc: () =>
    t`You can set a custom proxy URL to increase your privacy.`,
  vault: () => t`Vault`,
  vaultDesc: () => t`Multi-layer encryption to most important notes`,
  createVaultDesc: () => t`Create a vault to store your most important notes`,
  changeVaultPasswordDesc: () => t`Setup a new password for your vault.`,
  clearVaultDesc: () => t`Clear your vault and remove all notes from it`,
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
  automaticBackupsWithAttachmentsDesc: () =>
    t`Set the interval to create a backup (with attachments) automatically.

NOTE: Creating a backup with attachments can take a while, and also fail completely. The app will try to resume/restart the backup in case of interruptions.`,
  selectBackupDir: () => t`Select backup directory`,
  selectBackupDirDesc: () => t`Choose where to save your backups`,
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
  appVersion: () => t`App version`,
  defaultSound: () => t`Default sound`,
  subNotSupported: () =>
    t`"This version of Notesnook app does not support in-app purchases. Kindly login on the Notesnook web app to make the purchase."`,
  goToWebApp: () => t`Go to web app`,
  subOnWeb: () => t`Subscribed on web`,
  openInBrowserToManageSub: () => t`Open in browser to manage subscription`,
  editProfilePicture: () => t`Edit profile picture`,
  setFullName: () => t`Set full name`,
  setFullNameDesc: () =>
    t`Your name is end-to-end encrypted and only visible to you.`,
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
  clearTrashConfirm: () => t`Are you sure you want to clear trash?`,
  trashCleared: () => t`Trash cleared`,
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
    t`Creating a${type === "full" ? " full" : ""} backup`,
  backupDataDesc: () =>
    t`All your backups are stored in 'Phone Storage/Notesnook/backups/' folder`,
  backupSuccess: () => t`Backup successful`,
  biometricsAuthFailed: () => t`Biometrics authentication failed`,
  biometricsAuthFailedDesc: () => t`Wait 30 seconds to try again`,
  biometricsAuthCancelled: () => t`Authentication cancelled by user`,
  biometricsAuthError: () => t`Authentication failed`,
  tryAgain: () => t`Tap to try again`,
  rateAppMessage: () => t`We would love to know what you think!`,
  rateAppActionText: (platform: string) =>
    t`Rate Notesnook on ${
      platform === "ios" ? strings.appStore() : strings.playStore()
    }`,
  appStore: () => t`App Store`,
  playStore: () => t`Play Store`,
  recoveryKeyMessage: () => t`Keep your data safe`,
  recoveryKeyMessageActionText: () => t`Save your account recovery key`,
  loginMessage: () => t`You are not logged in`,
  loginMessageActionText: () => t`Login to encrypt and sync notes`,
  syncDisabled: () => t`Sync is disabled`,
  syncDisabledActionText: () => t`Please confirm your email to sync notes`,
  autoBackupsOffMessage: () => t`Automatic backups are off`,
  autoBackupsOffActionText: () =>
    t`Get Notesnook Pro to enable automatic backups`,
  newUpdateMessage: () => t`New update available`,
  newUpdateActionText: () => t`Tap here to update to the latest version`,
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
  getNotesnookPro: () => t`Get Notesnook Pro`,
  colorsProMessage: () => t`Unlock more colors with Notesnook Pro`,
  exportProMessage: () =>
    t`Export notes as PDF, Markdown and HTML with Notesnook Pro`,
  tagsProMessage: () => t`Create unlimited tags with Notesnook Pro`,
  notebookProMessage: () => t`Create unlimited notebooks with Notesnook Pro`,
  vaultProMessage: () => t`Create unlimited vaults with Notesnook Pro`,
  emailConfirmationLinkSent: () =>
    t`We have sent you an email confirmation link. Please check your email inbox. If you cannot find the email, check your spam folder.`,
  waitBeforeResendEmail: () => t`Please wait before requesting another email`,
  verificationEmailSent: () => t`Verification email sent`,
  failedToSendVerificationEmail: () => t`Failed to send verification email`,
  resendEmail: () => t`Resend email`,
  trialEndingSoon: () => t`Your free trial is ending soon`,
  trialExpired: () => t`Your free trial has expired`,
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
  deleteTags: (count: number) =>
    plural(count, {
      one: "Delete tag",
      other: "Delete # tags"
    }),
  deleteTagsConfirm: () => t`Are you sure you want to delete these tags?`,
  deleteItemConfirmation: (itemType: string) =>
    t`Are you sure you want to delete this ${strings.dataTypes[
      itemType as keyof typeof strings.dataTypes
    ]()}?`,
  deleteItem: (itemType: string) =>
    t`Delete ${strings.dataTypes[
      itemType as keyof typeof strings.dataTypes
    ]()}`,
  filterAttachments: () => t`Filter attachments by filename, type or hash`,
  oldPassword: () => t`Old password`,
  newPassword: () => t`New password`,
  email: () => t`Email`,
  emailInvalid: () => t`Invalid email`,
  confirmPassword: () => t`Confirm password`,
  currentPin: () => t`Current pin`,
  currentPassword: () => t`Current password`,
  newPin: () => t`New pin`,
  confirmPin: () => t`Confirm pin`,
  confirmNewPassword: () => t`Confirm new password`,
  colorTitle: () => t`Color title`,
  enterNotebookDescription: () => t`Enter notebook description`,
  searchNotebooks: () => t`Search notebooks`,
  enterNewEmail: () => t`Enter your new email`,
  verifyNewEmail: () => t`Enter verification code sent to your new email`,
  issuePlaceholder: () => t`Tell us more about the issue you are facing. 

For example:
- What were you trying to do in the app?
- What did you expect to happen?
- Steps to reproduce the issue 
- Things you have tried etc.`,
  searchSectionToLinkPlaceholder: () =>
    t`Search a section of a note to link to`,
  searchNoteToLinkPlaceholder: () => t`Search a note to link to`,
  searchForTags: () => t`Search or add a tag`,
  searchANote: () => t`Search a note`,
  remindeMeOf: () => t`Remind me of...`,
  addShortNote: () => t`Add a short note`,
  typeAKeywordToSearchIn: () => t`Type a keyword to search in`,
  searchingFor: () => t`Searching for`,
  typeAKeyword: () => t`Type a keyword`,
  search: () => t`Search`,
  enterEmailAddress: () => t`Enter email address`,
  enterValidEmail: () => t`Please enter a valid email address`,
  enterValidPhone: () => t`Please enter a valid phone number with country code`,
  errorGettingCodes: () => t`Error getting codes`,
  noResultsFound: () => t`No results found for`,
  routes: {
    Notes: () => t`Notes`,
    Notebooks: () => t`Notebooks`,
    Notebook: () => t`Notebook`,
    Favorites: () => t`Favorites`,
    Reminders: () => t`Reminders`,
    Trash: () => t`Trash`,
    Settings: () => t`Settings`,
    Tags: () => t`Tags`,
    Editor: () => t`Editor`,
    Home: () => t`Home`,
    Search: () => t`Search`,
    Monographs: () => t`Monographs`
  },
  searchInRoute: (routeName: string) =>
    t`Type a keyword to search in ${
      strings.routes[routeName as keyof typeof strings.routes]?.() || routeName
    }`,
  logoutConfirmation: () =>
    t`Are you sure you want to logout and clear all data stored on this device?`,
  backupDataBeforeLogout: () => t`Take a backup before logging out`,
  unsyncedChangesWarning: () =>
    t`You have unsynced notes. Take a backup or sync your notes to avoid losing your critical data.`,
  databaseSetupFailed: () =>
    t`Database setup failed, could not get database key`,
  streamingNotSupported: () => t`Streaming not supported`,
  unableToResolveDownloadUrl: () => t`Unable to resolve download url`,
  pleaseWaitBeforeSendEmail: () =>
    t`Please wait before requesting another email`,
  unableToSend2faCode: () => t`Unable to send 2FA code`,
  emailOrPasswordIncorrect: () => t`Email or password incorrect`,
  errorApplyingPromoCode: () => t`Error applying promo code`,
  noNotificationPermission: () =>
    t`"App does not have permission to schedule notifications"`,
  selectDayError: () => t`Please select the day to repeat the reminder on`,
  setTitleError: () => t`Please set title of the reminder`,
  dateError: () => t`Reminder date must be set in future`,
  failedToDecryptBackup: () => t`Failed to decrypt backup`,
  backupDirectoryNotSelected: () => t`"Backup directory not selected"`,
  legal: () => t`legal`,
  days: () => t`days`,
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
  "12-hour": () => t`12-hour`,
  "24-hour": () => t`24-hour`,
  noteTitle: () => t`Note title`,
  changesNotSaved: () => t`Your changes could not be saved`,
  changesNotSavedDesc: () =>
    t`It seems that your changes could not be saved. What to do next:`,
  changesNotSavedStep1: () =>
    t`Tap on "Dismiss" and copy the contents of your note so they are not lost.`,
  changesNotSavedStep2: () => t`Restart the app.`,
  thisNoteLocked: () => `This note is locked`,
  dismiss: () => t`Dismiss`,
  words: () => t`words`,
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
  restoringBackup: () => t`Restoring backups...`,
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
  logoutToChangeServerUrls: () =>
    t`You must log out in order to change/reset server URLs.`,
  enterValidUrl: () => t`Please enter a valid URL`,
  connectedToServer: () => t`Connected to all servers sucessfully.`,
  allServerUrlsRequired: () => t`All server urls are required.`,
  couldNotConnectTo: () => t`Could not connect to`,
  incorrectServerUrl: (url: string) =>
    t`The URL you have given (${url}) does not point to the`,
  serverVersionMismatch: () =>
    t`The server version is not compatible with the app.`,
  testConnectionBeforeSave: () =>
    t`Test connection before changing server urls`,
  serverUrlChanged: () => t`Server url changed`,
  restartAppToTakeEffect: () => t`Restart the app for changes to take effect.`,
  resetServerUrls: () => t`Reset server urls`,
  serverUrlsReset: () => t`Server urls reset`
};
