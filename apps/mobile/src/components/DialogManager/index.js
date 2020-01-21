import React, {Component} from 'react';
import {DeviceEventEmitter} from 'react-native';
import ActionSheet from '../ActionSheet';
import {ActionSheetComponent} from '../ActionSheetComponent';
import {Dialog} from '../Dialog';
import {VaultDialog} from '../VaultDialog';
import MoveNoteDialog from '../MoveNoteDialog';
import {AddTopicDialog} from '../AddTopicDialog';
import {AddNotebookDialog} from '../AddNotebookDialog';
import {DDS} from '../../../App';

export const _recieveEvent = (eventName, action) => {
  DeviceEventEmitter.addListener(eventName, action);
};

export const _unSubscribeEvent = (eventName, action) => {
  DeviceEventEmitter.removeListener(eventName, action);
};
export const dialogActions = {
  ACTION_DELETE: 511,
  ACTION_EXIT: 512,
  ACTION_EMPTY_TRASH: 513,
  ACTION_EXIT_FULLSCREEN: 514,
};

export const ActionSheetEvent = (
  item,
  colors,
  tags,
  rowItems,
  columnItems,
  extraData,
) => {
  DeviceEventEmitter.emit('ActionSheetEvent', {
    item,
    colors,
    tags,
    rowItems,
    columnItems,
    extraData,
  });
};
export const ActionSheetHideEvent = () => {
  DeviceEventEmitter.emit('ActionSheetHideEvent');
};

export const simpleDialogEvent = data => {
  DeviceEventEmitter.emit('simpleDialogEvent', data);
};

export const simpleDialogHideEvent = () => {
  DeviceEventEmitter.emit('simpleDialogHideEvent');
};

export const moveNoteEvent = () => {
  DeviceEventEmitter.emit('moveNoteEvent');
};
export const moveNoteHideEvent = () => {
  DeviceEventEmitter.emit('moveNoteHideEvent');
};

export const AddNotebookEvent = notebook => {
  DeviceEventEmitter.emit('addNotebookEvent', {item: notebook});
};
export const HideAddNotebookEvent = notebook => {
  DeviceEventEmitter.emit('hideAddNotebookEvent', notebook);
};
export const AddTopicEvent = notebook => {
  DeviceEventEmitter.emit('addTopicEvent', notebook);
};
export const HideAddTopicEvent = notebook => {
  DeviceEventEmitter.emit('hideAddTopicEvent', notebook);
};

export const updateEvent = data => {
  DeviceEventEmitter.emit('updateEvent', data);
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
      setNote({});
    } else {
      note = i;
      this.setState({
        item: i,
      });
    }
  };

  componentDidMount() {
    _recieveEvent('loadNoteEvent', this.loadNote);
    _recieveEvent('ActionSheetEvent', this._showActionSheet);
    _recieveEvent('ActionSheetHideEvent', this._hideActionSheet);

    _recieveEvent('simpleDialogEvent', this._showSimpleDialog);
    _recieveEvent('simpleDialogHideEvent', this._hideActionSheet);

    _recieveEvent('moveNoteEvent', this._showMoveNote);
    _recieveEvent('moveNoteHideEvent', this._hideMoveNote);

    _recieveEvent('addNotebookEvent', this.showAddNotebook);
    _recieveEvent('hideAddNotebookEvent', this.hideAddNotebook);

    _recieveEvent('addTopicEvent', this.showAddTopic);
    _recieveEvent('hideAddTopicEvent', this.hideAddTopic);
  }
  componentWillUnmount() {
    _unSubscribeEvent('loadNoteEvent', this.loadNote);

    _unSubscribeEvent('ActionSheetEvent', this._showActionSheet);
    _unSubscribeEvent('ActionSheetHideEvent', this._hideSimpleDialog);

    _unSubscribeEvent('simpleDialogEvent', this._showSimpleDialog);
    _unSubscribeEvent('simpleDialogHideEvent', this._hideSimpleDialog);

    _unSubscribeEvent('moveNoteEvent', this._showMoveNote);
    _unSubscribeEvent('moveNoteHideEvent', this._hideMoveNote);

    _unSubscribeEvent('addNotebookEvent', this.showAddNotebook);
    _unSubscribeEvent('hideAddNotebookEvent', this.hideAddNotebook);

    _unSubscribeEvent('addTopicEvent', this.showAddTopic);
    _unSubscribeEvent('hideAddTopicEvent', this.hideAddTopic);
  }

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
    } = this.state;
    return (
      <>
        <ActionSheet
          ref={ref => (this.actionSheet = ref)}
          customStyles={{
            backgroundColor: colors.bg,
            width: DDS.isTab ? '60%' : '100%',
            alignSelf: 'center',
          }}
          indicatorColor={colors.shade}
          initialOffsetFromBottom={0.5}
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
      </>
    );
  }
}
