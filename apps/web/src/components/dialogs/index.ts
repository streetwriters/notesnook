import React from "react";

const AddNotebookDialog = React.lazy(() => import("./add-notebook-dialog"));
const BuyDialog = React.lazy(() => import("./buy-dialog"));
const Confirm = React.lazy(() => import("./confirm"));
const EmailVerificationDialog = React.lazy(
  () => import("./email-verification-dialog")
);
const ImportDialog = React.lazy(() => import("./import-dialog"));
const LoadingDialog = React.lazy(() => import("./loading-dialog"));
const ProgressDialog = React.lazy(() => import("./progress-dialog"));
const MoveDialog = React.lazy(() => import("./move-note-dialog"));
const PasswordDialog = React.lazy(() => import("./password-dialog"));
const RecoveryKeyDialog = React.lazy(() => import("./recovery-key-dialog"));
const ItemDialog = React.lazy(() => import("./item-dialog"));
const FeatureDialog = React.lazy(() => import("./feature-dialog"));
const TrackingDetailsDialog = React.lazy(
  () => import("./tracking-details-dialog")
);
const ReminderDialog = React.lazy(() => import("./reminder-dialog"));
const AnnouncementDialog = React.lazy(() => import("./announcement-dialog"));
const IssueDialog = React.lazy(() => import("./issue-dialog"));
const MultifactorDialog = React.lazy(() => import("./mfa/multi-factor-dialog"));
const RecoveryCodesDialog = React.lazy(
  () => import("./mfa/recovery-code-dialog")
);
// import { MultifactorDialog, RecoveryCodesDialog } from "./multi-factor-dialog";
const OnboardingDialog = React.lazy(() => import("./onboarding-dialog"));
const AttachmentsDialog = React.lazy(() => import("./attachments-dialog"));
const Prompt = React.lazy(() => import("./prompt"));
const ToolbarConfigDialog = React.lazy(() => import("./toolbar-config-dialog"));
const MigrationDialog = React.lazy(() => import("./migration-dialog"));

export const Dialogs = {
  AddNotebookDialog,
  ToolbarConfigDialog,
  TrackingDetailsDialog,
  BuyDialog,
  Confirm,
  Prompt,
  EmailVerificationDialog,
  LoadingDialog,
  MoveDialog,
  PasswordDialog,
  RecoveryKeyDialog,
  ItemDialog,
  FeatureDialog,
  ProgressDialog,
  ReminderDialog,
  AnnouncementDialog,
  IssueDialog,
  ImportDialog,
  MultifactorDialog,
  RecoveryCodesDialog,
  OnboardingDialog,
  AttachmentsDialog,
  MigrationDialog,
};
