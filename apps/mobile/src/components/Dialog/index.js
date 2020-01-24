import React, {Component} from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {db, DDS} from '../../../App';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider/actions';
import NavigationService from '../../services/NavigationService';
import {getElevation, ToastEvent} from '../../utils/utils';
import {dialogActions, updateEvent} from '../DialogManager';

export class Dialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
  }

  _onPress = async () => {
    let {template, item} = this.props;

    switch (template.action) {
      case dialogActions.ACTION_DELETE: {
        if (item.type === 'note') {
          await db.deleteNotes([item]);
          ToastEvent.show('Note moved to trash', 'success', 3000);
          updateEvent({type: item.type});
        } else if (item.type === 'topic') {
          await db.deleteTopicFromNotebook(notebookID, item.title);
          updateEvent({type: 'notebook'});
          ToastEvent.show('Topic moved to trash', 'success', 3000);
        } else if (item.type === 'notebook') {
          await db.deleteNotebooks([item]);
          updateEvent({type: item.type});
          ToastEvent.show('Notebook moved to trash', 'success', 3000);
        }

        this.setState({
          visible: false,
        });
        break;
      }
      case dialogActions.ACTION_EXIT: {
        this.setState({
          visible: false,
        });
        NavigationService.goBack();

        break;
      }
      case dialogActions.ACTION_EMPTY_TRASH: {
        await db.clearTrash();
        updateEvent({type: ACTIONS.TRASH});
        ToastEvent.show('Trash cleared', 'success', 1000, () => {}, '');
        this.setState({
          visible: false,
        });

        break;
      }
      case dialogActions.ACTION_EXIT_FULLSCREEN: {
        updateEvent({type: ACTIONS.NOTES});
        DeviceEventEmitter.emit('closeFullScreenEditor');
        this.setState({
          visible: false,
        });
      }
    }
  };

  _onClose = () => {
    this.setState({
      visible: false,
    });
  };

  show = () => {
    this.setState({
      visible: true,
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
              width: DDS.isTab ? '50%' : '80%',
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

              <Text
                style={{
                  color: colors.accent,
                  fontFamily: WEIGHT.bold,
                  marginLeft: 5,
                  fontSize: SIZE.md,
                }}>
                {title}
              </Text>
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
                {paragraph}
              </Text>
            ) : null}

            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: 'row',
                marginTop: 20,
              }}>
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
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}
