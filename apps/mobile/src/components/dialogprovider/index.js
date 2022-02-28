import React from 'react';
import { useTracked } from '../../provider';
import { EditorSettings } from '../../views/Editor/EditorSettings';
import { AddNotebookDialog } from '../AddNotebookDialog';
import { AddTopicDialog } from '../AddTopicDialog';
import { AnnouncementDialog } from '../Announcements';
import { AttachmentDialog } from '../AttachmentDialog';
import Auth from '../auth';
import { SessionExpired } from '../auth/session-expired';
import { Dialog } from '../dialog';
import ExportDialog from '../ExportDialog';
import ImagePreview from '../image-preview';
import MergeEditor from '../MergeEditor';
import MoveNoteDialog from '../MoveNoteDialog';
import PremiumDialog from '../premium';
import { Expiring } from '../premium/expiring';
import PublishNoteDialog from '../PublishNoteDialog';
import RateDialog from '../RateDialog';
import RecoveryKeyDialog from '../RecoveryKeyDialog';
import RestoreDialog from '../RestoreDialog';
import ResultDialog from '../ResultDialog';
import SheetProvider from '../sheet-provider';
import TagsDialog from '../TagsDialog';
import { VaultDialog } from '../VaultDialog';

function DialogProvider() {
  const [state] = useTracked();
  const { colors } = state;

  return (
    <>
      <Dialog context="global" />
      <AddTopicDialog colors={colors} />
      <AddNotebookDialog colors={colors} />
      <PremiumDialog colors={colors} />
      <Auth colors={colors} />
      <MergeEditor />
      <ExportDialog />
      <RecoveryKeyDialog colors={colors} />
      <SheetProvider />
      <RestoreDialog />
      <ResultDialog />
      <VaultDialog colors={colors} />
      <MoveNoteDialog colors={colors} />
      <RateDialog />
      <ImagePreview />
      <EditorSettings />
      <PublishNoteDialog />
      <TagsDialog />
      <AttachmentDialog />
      <Expiring />
      <AnnouncementDialog />
      <SessionExpired />
    </>
  );
}

export default React.memo(DialogProvider, () => true);
