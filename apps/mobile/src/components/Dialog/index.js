import React, {Component} from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {ph, pv, SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {
  eApplyChanges,
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOnNewTopicAdded,
} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import {db, DDS, getElevation, history, ToastEvent} from '../../utils/utils';
import {Button} from '../Button';
import {dialogActions} from '../DialogManager/dialogActions';
import {updateEvent} from '../DialogManager/recievers';
import BaseDialog from './base-dialog';
import DialogButtons from './dialog-buttons';
import DialogHeader from './dialog-header';

export class Dialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      selecteItemsLength: 0,
    };
  }

  _onPress = async () => {
    let {template, item} = this.props;

    switch (template.action) {
      case dialogActions.ACTION_DELETE: {
        if (item.dateCreated && history.selectedItemsList.length === 0) {
          history.selectedItemsList = [];
          history.selectedItemsList.push(item);
        }

        for (var i = 0; i < history.selectedItemsList.length; i++) {
          let it = history.selectedItemsList[i];
          if (it.type === 'note') {
            await db.notes.delete(it.id);
            updateEvent({type: it.type});
            eSendEvent(eClearEditor);
          } else if (it.type === 'topic') {
            await db.notebooks.notebook(it.notebookId).topics.delete(it.title);
            eSendEvent(eOnNewTopicAdded);
            updateEvent({type: 'notebook'});
            ToastEvent.show('Topics deleted', 'success');
          } else if (it.type === 'notebook') {
            await db.notebooks.delete(it.id);
            updateEvent({type: it.type});
          }
        }
        updateEvent({type: ACTIONS.PINNED});

        let message;
        let notes = history.selectedItemsList.filter((o) => o.type === 'note');
        let notebooks = history.selectedItemsList.filter(
          (o) => o.type === 'notebook',
        );
        let topics = history.selectedItemsList.filter(
          (o) => o.type === 'topic',
        );
        if (notes.length > 0 && notebooks.length === 0 && topics.length === 0) {
          let msgPart = notes.length > 1 ? ' notes' : ' note';
          message = notes.length + msgPart + ' moved to trash';
        } else if (
          notes.length === 0 &&
          notebooks.length > 0 &&
          topics.length === 0
        ) {
          let msgPart = notebooks.length > 1 ? ' notebooks' : ' notebook';
          message = notebooks.length + msgPart + ' moved to trash';
        } else if (
          notes.length === 0 &&
          notebooks.length === 0 &&
          topics.length > 0
        ) {
          let msgPart = topics.length > 1 ? ' topics' : ' topic';
          message = topics.length + msgPart + ' moved to trash';
        }
        let itemsCopy = [...history.selectedItemsList];
        if (history.selectedItemsList[0].type !== 'topic')
          ToastEvent.show(
            message,
            'success',
            'global',
            6000,
            async () => {
              let trash = db.trash;

              for (var i = 0; i < itemsCopy.length; i++) {
                let it = itemsCopy[i];
                let trashItem = trash.all.find((item) => item.itemId === it.id);
                await db.trash.restore(trashItem.id);
                updateEvent({type: it.type});
              }
              updateEvent({type: ACTIONS.TRASH});
              updateEvent({type: ACTIONS.PINNED});
              ToastEvent.hide();
            },
            'Undo',
          );

        updateEvent({type: ACTIONS.CLEAR_SELECTION});
        updateEvent({type: ACTIONS.SELECTION_MODE, enabled: false});

        this.hide();
        break;
      }
      case dialogActions.ACTION_PERMANANT_DELETE: {
        if (item.dateCreated && history.selectedItemsList.length === 0) {
          history.selectedItemsList = [];
          history.selectedItemsList.push(item);
        }
        let ids = [];
        history.selectedItemsList.forEach((item) => ids.push(item.id));

        await db.trash.delete(...ids);

        updateEvent({type: ACTIONS.TRASH});
        updateEvent({type: ACTIONS.CLEAR_SELECTION});
        updateEvent({type: ACTIONS.SELECTION_MODE, enabled: false});
        ToastEvent.show('Item permanantly deleted');
        this.hide();
        break;
      }
      case dialogActions.ACTION_EXIT: {
        this.setState({
          visible: false,
        });
        NavigationService.goBack();
        this.hide();
        break;
      }
      case dialogActions.ACTION_NEW_NOTE: {
        eSendEvent(eOnLoadNote, {type: 'new'});
        this.hide();
        break;
      }
      case dialogActions.ACTION_EMPTY_TRASH: {
        await db.trash.clear();
        updateEvent({type: ACTIONS.TRASH});

        updateEvent({type: ACTIONS.CLEAR_SELECTION});
        updateEvent({type: ACTIONS.SELECTION_MODE, enabled: false});
        ToastEvent.show('Trash cleared', 'error');
        this.hide();

        break;
      }
      case dialogActions.ACTION_EXIT_FULLSCREEN: {
        updateEvent({type: ACTIONS.NOTES});
        eSendEvent(eCloseFullscreenEditor);
        this.hide();
        break;
      }
      case dialogActions.ACTION_TRASH: {
        await db.trash.restore(i.id);
        this.hide();
        ToastEvent.show(
          item.type.slice(0, 1).toUpperCase() +
            item.type.slice(1) +
            ' restored',
          'success',
        );

        updateEvent({type: ACTIONS.TRASH});
        this.hide();
        break;
      }
      case dialogActions.ACTION_APPLY_CHANGES: {
        eSendEvent(eApplyChanges);
        this.hide();
        break;
      }
    }
  };

  _onClose = () => {
    let {template, item} = this.props;
    if (dialogActions.ACTION_TRASH === template.action) {
      // delete item forever.
      db.trash.delete(item.id);
    }
    this.setState({
      visible: false,
    });
  };

  show = () => {
    this.setState({
      visible: true,
      selectedItemsLength: history.selectedItemsList.length,
    });
  };
  hide = () => {
    this.setState({
      visible: false,
    });
  };

  render() {
    const {template, colors} = this.props;
    const {title, paragraph, positiveText, negativeText, icon} = template;
    const {visible} = this.state;
    return (
      <BaseDialog visible={visible} onRequestClose={this.hide}>
        <View
          style={{
            ...getElevation(5),
            width: DDS.isTab ? '40%' : '80%',
            maxHeight: 350,
            borderRadius: 5,
            backgroundColor: colors.bg,
            paddingHorizontal: ph,
            paddingVertical: pv,
          }}>
          <DialogHeader
            title={title}
            icon={icon}
            paragraph={
              this.state.selectedItemsLength > 0
                ? 'Delete ' +
                  this.state.selectedItemsLength +
                  ' selected items?'
                : paragraph
            }
          />

          {template.noButtons ? null : (
            <DialogButtons
              onPressNegative={this._onClose}
              onPressPositive={this._onPress}
              positiveTitle={positiveText}
              negativeTitle={negativeText}
            />
          )}
        </View>
      </BaseDialog>
    );
  }
}
