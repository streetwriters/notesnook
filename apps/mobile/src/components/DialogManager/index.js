import React, { Component } from 'react';
import { eSubscribeEvent, eUnSubscribeEvent } from '../../services/EventManager';
import { getCurrentColors } from '../../utils/Colors';
import { eThemeUpdated } from '../../utils/Events';
import { EditorSettings } from '../../views/Editor/EditorSettings';
import { AddNotebookDialog } from '../AddNotebookDialog';
import { AddTopicDialog } from '../AddTopicDialog';
import { AnnouncementDialog } from '../Announcements';
import { AttachmentDialog } from '../AttachmentDialog';
import { Dialog } from '../Dialog';
import ExportDialog from '../ExportDialog';
import GeneralSheet from '../GeneralSheet';
import ImagePreview from '../ImagePreview';
import LoginDialog from '../LoginDialog';
import MergeEditor from '../MergeEditor';
import MoveNoteDialog from '../MoveNoteDialog';
import PremiumDialog from '../Premium';
import { Expiring } from '../Premium/expiring';
import PublishNoteDialog from '../PublishNoteDialog';
import RateDialog from '../RateDialog';
import RecoveryKeyDialog from '../RecoveryKeyDialog';
import RestoreDialog from '../RestoreDialog';
import ResultDialog from '../ResultDialog';
import TagsDialog from '../TagsDialog';
import { VaultDialog } from '../VaultDialog';

export class DialogManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colors: getCurrentColors()
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
      nextState !== this.state
    );
  }

  onThemeChange = () => {
    this.setState({
      colors: getCurrentColors()
    });
  };

  componentDidMount() {
    eSubscribeEvent(eThemeUpdated, this.onThemeChange);
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eThemeUpdated, this.onThemeChange);
  }

  render() {
    let {colors} = this.state;
    return (
      <>
        <Dialog context="global" />
        <AddTopicDialog colors={colors} />
        <AddNotebookDialog colors={colors} />
        <PremiumDialog colors={colors} />
        <LoginDialog colors={colors} />
        <MergeEditor />
        <ExportDialog />
        <RecoveryKeyDialog colors={colors} />
        <GeneralSheet />
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
      </>
    );
  }
}
