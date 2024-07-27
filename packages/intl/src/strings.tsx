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
  monographSelfDestructDesc:
    () => t`Published note link will be automatically deleted once it is
                viewed by someone.`,
  monographLearnMore: () => t`Learn more about Notesnook Monograph`,
  rateAppHeading: () => t`Do you enjoy using Notesnook?`,
  rateAppDesc:
    () => t`It took us a year to bring Notesnook to life. Share your experience
          and suggestions to help us improve it.`,
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
    attachment: () => t`Attachments`
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
    fileDownloaded: (name?: string) => t`${name || "File"} downloaded`
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
    document: () => t`Documents`
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
  enterPassword: () => t`Enter password`
};
