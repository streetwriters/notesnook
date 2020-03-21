import React, {Component} from 'react';
import {Modal, Text, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {
  eClearEditor,
  eCloseFullscreenEditor,
  eOnNewTopicAdded,
} from '../../services/events';
import NavigationService from '../../services/NavigationService';
import {db, DDS, getElevation, history, ToastEvent} from '../../utils/utils';
import {dialogActions} from '../DialogManager/dialogActions';
import {updateEvent} from '../DialogManager/recievers';

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

        history.selectedItemsList.forEach(async i => {
          if (i.type === 'note') {
            console.log(i.id);
            await db.notes.delete(i.id);
            ToastEvent.show('Notes moved to trash', 'error');
            updateEvent({type: i.type});
            updateEvent({type: ACTIONS.PINNED});

            eSendEvent(eClearEditor);
          } else if (i.type === 'topic') {
            await db.notebooks.notebook(i.notebookId).topics.delete(i.title);

            eSendEvent(eOnNewTopicAdded);
            updateEvent({type: 'notebook'});

            ToastEvent.show('Topics deleted', 'error');
          } else if (i.type === 'notebook') {
            await db.notebooks.delete(i.id);
            updateEvent({type: i.type});
            updateEvent({type: ACTIONS.PINNED});
            ToastEvent.show('Notebooks moved to trash', 'error');
          }
        });

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
        history.selectedItemsList.forEach(item => ids.push(item.id));

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
    console.log(history.selectedItemsList.length, 'length');
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
      <Modal
        visible={visible}
        transparent={true}
        animated
        animationType="fade"
        onRequestClose={() => this.setState({visible: false})}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <TouchableOpacity
            onPress={this.hide}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
          />
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
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              {icon ? (
                <Icon name={icon} color={colors.accent} size={SIZE.lg} />
              ) : null}

              {template.noTitle ? null : (
                <Text
                  style={{
                    color: colors.accent,
                    fontFamily: WEIGHT.bold,
                    marginLeft: 5,
                    fontSize: SIZE.md,
                  }}>
                  {title}
                </Text>
              )}
            </View>

            {paragraph ? (
              <Text
                style={{
                  color: colors.icon,
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm - 2,
                  textAlign: 'center',
                  marginTop: 10,
                }}>
                {this.state.selectedItemsLength > 0
                  ? 'Delete ' +
                    this.state.selectedItemsLength +
                    ' selected items?'
                  : paragraph}
              </Text>
            ) : null}

            {template.noButtons ? null : (
              <View
                style={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: 'row',
                  marginTop: 20,
                }}>
                <TouchableOpacity
                  activeOpacity={opacity}
                  onPress={this._onClose}
                  style={{
                    paddingVertical: pv,
                    paddingHorizontal: ph,
                    borderRadius: 5,
                    width: '48%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: colors.nav,
                  }}>
                  <Text
                    style={{
                      fontFamily: WEIGHT.medium,
                      color: colors.icon,
                      fontSize: SIZE.sm,
                    }}>
                    {negativeText}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={opacity}
                  onPress={this._onPress}
                  style={{
                    paddingVertical: pv,
                    paddingHorizontal: ph,
                    borderRadius: 5,
                    width: '48%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderColor: colors.accent,
                    backgroundColor: colors.accent,
                    borderWidth: 1,
                  }}>
                  <Text
                    style={{
                      fontFamily: WEIGHT.medium,
                      color: 'white',
                      fontSize: SIZE.sm,
                    }}>
                    {positiveText}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    );
  }
}
