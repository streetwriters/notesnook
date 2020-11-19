import React, {Component} from 'react';
import {View} from 'react-native';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import NavigationService from '../../services/Navigation';
import {getElevation, history} from '../../utils';
import {db} from '../../utils/DB';
import {
  eApplyChanges,
  eClearEditor,
  eCloseFullscreenEditor,
  eOnLoadNote,
  eOnNewTopicAdded,
} from '../../utils/Events';
import {ph, pv} from '../../utils/SizeUtils';
import {dialogActions} from '../DialogManager/DialogActions';
import {updateEvent} from '../DialogManager/recievers';
import Seperator from '../Seperator';
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
      case dialogActions.ACTION_PERMANANT_DELETE: {
        if (item.dateCreated && history.selectedItemsList.length === 0) {
          history.selectedItemsList = [];
          history.selectedItemsList.push(item);
        }
        let ids = [];
        history.selectedItemsList.forEach((item) => ids.push(item.id));
        await db.trash.delete(...ids);
        updateEvent({type: Actions.TRASH});
        updateEvent({type: Actions.CLEAR_SELECTION});
        updateEvent({type: Actions.SELECTION_MODE, enabled: false});
        ToastEvent.show('Items permanantly deleted');
        this.hide();
        break;
      }
      case dialogActions.ACTION_EMPTY_TRASH: {
        await db.trash.clear();
        updateEvent({type: Actions.TRASH});
        updateEvent({type: Actions.CLEAR_SELECTION});
        updateEvent({type: Actions.SELECTION_MODE, enabled: false});
        ToastEvent.show('Trash cleared', 'error');
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
            width: DDS.isTab ? 350 : '80%',
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
          <Seperator />

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
