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

import { useThemeColors } from "@notesnook/theme";
import React from "react";
import { AnnouncementDialog } from "../announcements";
import AuthModal from "../auth/auth-modal";
import { SessionExpired } from "../auth/session-expired";
import { Dialog } from "../dialog";
import { AppLockPassword } from "../dialogs/applock-password";
import JumpToSectionDialog from "../dialogs/jump-to-section";
import { LoadingDialog } from "../dialogs/loading";
import PDFPreview from "../dialogs/pdf-preview";
import ResultDialog from "../dialogs/result";
import { VaultDialog } from "../dialogs/vault";
import ImagePreview from "../image-preview";
import MergeConflicts from "../merge-conflicts";
import SheetProvider from "../sheet-provider";
import RateAppSheet from "../sheets/rate-app";
import RecoveryKeySheet from "../sheets/recovery-key";
import Progress from "../dialogs/progress";

const DialogProvider = () => {
  const { colors } = useThemeColors();

  return (
    <>
      <AppLockPassword />
      <LoadingDialog />
      <Dialog context="global" />
      <AuthModal colors={colors} />
      <MergeConflicts />
      <RecoveryKeySheet colors={colors} />
      <SheetProvider />
      <SheetProvider context="sync_progress" />
      <ResultDialog />
      <VaultDialog colors={colors} />
      <RateAppSheet />
      <ImagePreview />
      <AnnouncementDialog />
      <SessionExpired />
      <PDFPreview />
      <JumpToSectionDialog />
      <Progress />
    </>
  );
};

export default React.memo(DialogProvider, () => true);
