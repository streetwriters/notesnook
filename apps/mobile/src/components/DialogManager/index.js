import React, {Component} from 'react';
import {DDS} from '../../../App';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eCloseActionSheet,
  eCloseAddNotebookDialog,
  eCloseAddTopicDialog,
  eCloseLoginDialog,
  eCloseMoveNoteDialog,
  eCloseSimpleDialog,
  eDispatchAction,
  eOnLoadNote,
  eOpenActionSheet,
  eOpenAddNotebookDialog,
  eOpenAddTopicDialog,
  eOpenLoginDialog,
  eOpenMoveNoteDialog,
  eOpenSimpleDialog,
} from '../../services/events';
import ActionSheet from '../ActionSheet';
import {ActionSheetComponent} from '../ActionSheetComponent';
import {AddNotebookDialog} from '../AddNotebookDialog';
import {AddTopicDialog} from '../AddTopicDialog';
import {Dialog} from '../Dialog';
import LoginDialog from '../LoginDialog';
import MoveNoteDialog from '../MoveNoteDialog';
import {VaultDialog} from '../VaultDialog';

export const dialogActions = {
  ACTION_DELETE: 511,
  ACTION_EXIT: 512,
  ACTION_EMPTY_TRASH: 513,
  ACTION_EXIT_FULLSCREEN: 514,
  ACTION_TRASH: 515,
};

export const ActionSheetEvent = (
  item,
  colors,
  tags,
  rowItems,
  columnItems,
  extraData,
) => {
  eSendEvent(eOpenActionSheet, {
    item,
    colors,
    tags,
    rowItems,
    columnItems,
    extraData,
  });
};
export const ActionSheetHideEvent = () => {
  eSendEvent(eCloseActionSheet);
};

export const simpleDialogEvent = data => {
  eSendEvent(eOpenSimpleDialog, data);
};

export const simpleDialogHideEvent = () => {
  eSendEvent(eCloseSimpleDialog);
};

export const moveNoteEvent = () => {
  eSendEvent(eOpenMoveNoteDialog);
};
export const moveNoteHideEvent = () => {
  eSendEvent(eCloseMoveNoteDialog);
};

export const AddNotebookEvent = notebook => {
  eSendEvent(eOpenAddNotebookDialog, {item: notebook});
};
export const HideAddNotebookEvent = notebook => {
  eSendEvent(eCloseAddNotebookDialog, notebook);
};
export const AddTopicEvent = notebook => {
  eSendEvent(eOpenAddTopicDialog, notebook);
};
export const HideAddTopicEvent = notebook => {
  eSendEvent(eCloseAddTopicDialog, notebook);
};

export const updateEvent = data => {
  eSendEvent(eDispatchAction, data);
};

export const TEMPLATE_DELETE = type => {
  return {
    title: `Delete ${type}`,
    paragraph: `Are you sure you want to delete this ${type}`,
    positiveText: 'Delete',
    negativeText: 'Cancel',
    action: dialogActions.ACTION_DELETE,
    icon: 'trash',
  };
};

export const TEMPLATE_TRASH = type => {
  return {
    title: `Delete ${type}`,
    paragraph: `Restore or delete ${type} forever`,
    positiveText: 'Restore',
    negativeText: 'Delete',
    action: dialogActions.ACTION_TRASH,
    icon: 'trash',
  };
};

export const TEMPLATE_EXIT_FULLSCREEN = () => {
  return {
    title: `Exit fullscreen editor?`,
    paragraph: `Are you sure you want to exit fullscreen editor?`,
    positiveText: 'Exit',
    negativeText: 'Cancel',
    action: dialogActions.ACTION_EXIT_FULLSCREEN,
    icon: 'x',
  };
};

export const TEMPLATE_EXIT = type => {
  return {
    title: `Close ${type}`,
    paragraph: `Are you sure you want to close ${type}`,
    positiveText: `Close`,
    negativeText: 'Cancel',
    action: dialogActions.ACTION_EXIT,
    icon: 'x',
  };
};

export const TEMPLATE_EMPTY_TRASH = {
  title: 'Empty Trash',
  paragraph: 'Are you sure you want to clear the trash?',
  icon: 'trash',
  positiveText: 'Clear',
  negativeText: 'Cancel',
  action: dialogActions.ACTION_EMPTY_TRASH,
};

export class DialogManager extends Component {
  constructor(props) {
    super(props);
    this.actionSheet;
    this.opened = false;
    this.state = {
      item: {},
      actionSheetData: {
        colors: false,
        tags: false,
        rowItems: [],
        columnItems: [],
      },
      simpleDialog: {
        title: '',
        paragraph: '',
        positiveText: '',
        negativeText: '',
        action: 0,
        icon: '',
      },
      isPerm: false,
      shareAfterUnlock: false,
    };
  }

  shouldComponentUpdate(nextProps, nextState) {
    return (
      JSON.stringify(nextProps) !== JSON.stringify(this.props) ||
      nextState !== this.state
    );
  }

  _showActionSheet = data => {
    this.setState(
      {
        actionSheetData: data,
        item: data.item,
      },
      () => {
        this.actionSheet._setModalVisible();
      },
    );
  };

  _hideActionSheet = () => {
    this.actionSheet._setModalVisible();
  };

  _showMoveNote = () => {
    this.moveNoteDialog.open();
  };

  _hideMoveNote = () => {
    this.moveNoteDialog.close();
  };

  loadNote = i => {
    if (i && i.type === 'new') {
      this.setState({
        note: {},
      });
    } else {
      note = i;
      this.setState({
        item: i,
      });
    }
  };

  componentDidMount() {
    eSubscribeEvent(eOnLoadNote, this.loadNote);

    eSubscribeEvent(eOpenActionSheet, this._showActionSheet);
    eSubscribeEvent(eCloseActionSheet, this._hideSimpleDialog);

    eSubscribeEvent(eOpenSimpleDialog, this._showSimpleDialog);
    eSubscribeEvent(eCloseSimpleDialog, this._hideSimpleDialog);

    eSubscribeEvent(eOpenMoveNoteDialog, this._showMoveNote);
    eSubscribeEvent(eCloseMoveNoteDialog, this._hideMoveNote);

    eSubscribeEvent(eOpenAddNotebookDialog, this.showAddNotebook);
    eSubscribeEvent(eCloseAddNotebookDialog, this.hideAddNotebook);

    eSubscribeEvent(eOpenAddTopicDialog, this.showAddTopic);
    eSubscribeEvent(eCloseAddTopicDialog, this.hideAddTopic);

    eSubscribeEvent(eOpenLoginDialog, this.showLoginDialog);
    eSubscribeEvent(eCloseLoginDialog, this.hideLoginDialog);
  }

  componentWillUnmount() {
    eUnSubscribeEvent(eOnLoadNote, this.loadNote);

    eUnSubscribeEvent(eOpenActionSheet, this._showActionSheet);
    eUnSubscribeEvent(eCloseActionSheet, this._hideSimpleDialog);

    eUnSubscribeEvent(eOpenSimpleDialog, this._showSimpleDialog);
    eUnSubscribeEvent(eCloseSimpleDialog, this._hideSimpleDialog);

    eUnSubscribeEvent(eOpenMoveNoteDialog, this._showMoveNote);
    eUnSubscribeEvent(eCloseMoveNoteDialog, this._hideMoveNote);

    eUnSubscribeEvent(eOpenAddNotebookDialog, this.showAddNotebook);
    eUnSubscribeEvent(eCloseAddNotebookDialog, this.hideAddNotebook);

    eUnSubscribeEvent(eOpenAddTopicDialog, this.showAddTopic);
    eUnSubscribeEvent(eCloseAddTopicDialog, this.hideAddTopic);

    eUnSubscribeEvent(eOpenLoginDialog, this.showLoginDialog);
    eUnSubscribeEvent(eCloseLoginDialog, this.hideLoginDialog);
  }

  showLoginDialog = () => {
    this.loginDialog.open();
  };

  hideLoginDialog = () => {
    alert('here');
    this.loginDialog.close();
  };

  showAddNotebook = data => {
    this.setState(
      {
        item: data.item ? data.item : {},
      },
      () => {
        this.addNotebooksDialog.open();
      },
    );
  };
  hideAddNotebook = () => {
    this.addNotebooksDialog.close();
  };

  showAddTopic = () => {
    this.setState({
      item: notebook,
    });
    this.addTopicsDialog.open();
  };

  hideAddTopic = () => {
    this.addTopicsDialog.close();
  };

  _showSimpleDialog = data => {
    this.setState(
      {
        simpleDialog: data,
      },
      () => {
        this.simpleDialog.show();
      },
    );
  };
  _hideSimpleDialog = data => {
    this.simpleDialog.hide();
  };

  _showVaultDialog = () => {
    this.vaultDialogRef.open();
  };
  _hideVaultDialog = () => {
    this.vaultDialogRef.close();
  };

  onActionSheetHide = () => {
    if (this.show) {
      switch (this.show) {
        case 'delete': {
          this._showSimpleDialog(TEMPLATE_DELETE(this.state.item.type));
          break;
        }
        case 'lock': {
          this._showVaultDialog();
          break;
        }
        case 'unlock': {
          this.setState({
            isPerm: true,
          });
          this._showVaultDialog();
          break;
        }
        case 'unlock_share': {
          this.setState({
            isPerm: false,
            shareAfterUnlock: true,
          });
          this._showVaultDialog();
          break;
        }
        case 'notebook': {
          this.showAddNotebook({item: this.state.item});
          break;
        }
        case 'topic': {
          this.showAddTOpic();
          break;
        }
      }
    }
    this.show = null;
  };

  render() {
    let {colors} = this.props;
    let {
      actionSheetData,
      item,
      simpleDialog,
      isPerm,
      vaultDialog,
      unlock,
      shareAfterUnlock,
    } = this.state;
    return (
      <>
        <ActionSheet
          ref={ref => (this.actionSheet = ref)}
          containerStyle={{
            backgroundColor: colors.bg,
            width: DDS.isTab ? 500 : '100%',
            alignSelf: DDS.isTab ? 'flex-end' : 'center',
            marginRight: DDS.isTab ? 12 : null,
            borderRadius: 10,
            marginBottom: DDS.isTab ? 50 : 0,
          }}
          extraScroll={DDS.isTab ? 50 : 0}
          indicatorColor={colors.shade}
          footerAlwaysVisible={DDS.isTab}
          footerHeight={DDS.isTab ? 20 : 10}
          footerStyle={
            DDS.isTab
              ? {
                  borderRadius: 10,
                  backgroundColor: colors.bg,
                }
              : null
          }
          initialOffsetFromBottom={DDS.isTab ? 1 : 0.5}
          bounceOnOpen={true}
          gestureEnabled={true}
          onClose={() => {
            this.onActionSheetHide();
          }}>
          <ActionSheetComponent
            item={item}
            setWillRefresh={value => {
              this.willRefresh = true;
            }}
            hasColors={actionSheetData.colors}
            hasTags={actionSheetData.colors}
            overlayColor={
              colors.night ? 'rgba(225,225,225,0.1)' : 'rgba(0,0,0,0.3)'
            }
            rowItems={actionSheetData.rowItems}
            columnItems={actionSheetData.columnItems}
            close={value => {
              if (value) {
                this.show = value;
              }
              this.actionSheet._setModalVisible();
            }}
          />
        </ActionSheet>

        <Dialog
          ref={ref => (this.simpleDialog = ref)}
          item={item}
          colors={colors}
          template={simpleDialog}
        />

        <VaultDialog
          ref={ref => (this.vaultDialogRef = ref)}
          colors={colors}
          note={item}
          perm={isPerm}
          shareAfterUnlock={shareAfterUnlock}
          openedToUnlock={false}
          visible={vaultDialog}
        />

        <MoveNoteDialog
          ref={ref => (this.moveNoteDialog = ref)}
          colors={colors}
        />

        <AddTopicDialog
          ref={ref => (this.addTopicsDialog = ref)}
          toEdit={item}
          notebookID={
            actionSheetData.extraData
              ? actionSheetData.extraData.notebookID
              : null
          }
          colors={colors}
        />
        <AddNotebookDialog
          ref={ref => (this.addNotebooksDialog = ref)}
          toEdit={item}
          colors={colors}
        />

        <LoginDialog colors={colors} ref={ref => (this.loginDialog = ref)} />
      </>
    );
  }
}
