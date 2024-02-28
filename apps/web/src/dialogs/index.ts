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

import React from "react";
import SettingsDialog from "./settings";

const AddNotebookDialog = React.lazy(() => import("./add-notebook-dialog"));
const BuyDialog = React.lazy(() => import("./buy-dialog"));
const Confirm = React.lazy(() => import("./confirm"));
const EmailVerificationDialog = React.lazy(
  () => import("./email-verification-dialog")
);
const LoadingDialog = React.lazy(() => import("./loading-dialog"));
const ProgressDialog = React.lazy(() => import("./progress-dialog"));
const MoveDialog = React.lazy(() => import("./move-note-dialog"));
const PasswordDialog = React.lazy(() => import("./password-dialog"));
const RecoveryKeyDialog = React.lazy(() => import("./recovery-key-dialog"));
const ItemDialog = React.lazy(() => import("./item-dialog"));
const FeatureDialog = React.lazy(() => import("./feature-dialog"));
const ReminderDialog = React.lazy(() => import("./reminder-dialog"));
const AddReminderDialog = React.lazy(() => import("./add-reminder-dialog"));
const ReminderPreviewDialog = React.lazy(
  () => import("./reminder-preview-dialog")
);
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
const MigrationDialog = React.lazy(() => import("./migration-dialog"));
const EmailChangeDialog = React.lazy(() => import("./email-change-dialog"));
const AddTagsDialog = React.lazy(() => import("./add-tags-dialog"));
const ThemeDetailsDialog = React.lazy(() => import("./theme-details-dialog"));
const CreateColorDialog = React.lazy(() => import("./create-color-dialog"));
const EditProfileDialog = React.lazy(() => import("./edit-profile-dialog"));

export const Dialogs = {
  AddNotebookDialog,
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
  MultifactorDialog,
  RecoveryCodesDialog,
  OnboardingDialog,
  AttachmentsDialog,
  MigrationDialog,
  AddReminderDialog,
  ReminderPreviewDialog,
  EmailChangeDialog,
  AddTagsDialog,
  SettingsDialog,
  ThemeDetailsDialog,
  CreateColorDialog,
  EditProfileDialog
};
