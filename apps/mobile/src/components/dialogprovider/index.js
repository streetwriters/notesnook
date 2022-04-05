import React from 'react';
import { useThemeStore } from '../../stores/theme';
import { EditorSettings } from '../../screens/editor/EditorSettings';
import { AddNotebookSheet } from '../sheets/add-notebook';
import { AddTopicDialog } from '../dialogs/add-topic';
import { AnnouncementDialog } from '../announcements';
import { AttachmentDialog } from '../attachments';
import Auth from '../auth';
import { SessionExpired } from '../auth/session-expired';
import { Dialog } from '../dialog';
import ExportNotesSheet from '../sheets/export-notes';
import ImagePreview from '../image-preview';
import MergeConflicts from '../merge-conflicts';
import AddToNotebookSheet from '../sheets/add-to';
import PremiumDialog from '../premium';
import { Expiring } from '../premium/expiring';
import PublishNoteSheet from '../sheets/publish-note';
import RateAppSheet from '../sheets/rate-app';
import RecoveryKeySheet from '../sheets/recovery-key';
import RestoreDataSheet from '../sheets/restore-data';
import ResultDialog from '../dialogs/result';
import SheetProvider from '../sheet-provider';
import ManageTagsSheet from '../sheets/manage-tags';
import { VaultDialog } from '../dialogs/vault';

const DialogProvider = React.memo(
  () => {
    const colors = useThemeStore(state => state.colors);

    return (
      <>
        <Dialog context="global" />
        <AddTopicDialog colors={colors} />
        <AddNotebookSheet colors={colors} />
        <PremiumDialog colors={colors} />
        <Auth colors={colors} />
        <MergeConflicts />
        <ExportNotesSheet />
        <RecoveryKeySheet colors={colors} />
        <SheetProvider />
        <SheetProvider context="sync_progress" />
        <RestoreDataSheet />
        <ResultDialog />
        <VaultDialog colors={colors} />
        <AddToNotebookSheet colors={colors} />
        <RateAppSheet />
        <ImagePreview />
        <EditorSettings />
        <PublishNoteSheet />
        <ManageTagsSheet />
        <AttachmentDialog />
        <Expiring />
        <AnnouncementDialog />
        <SessionExpired />
      </>
    );
  },
  () => true
);

export default DialogProvider;
