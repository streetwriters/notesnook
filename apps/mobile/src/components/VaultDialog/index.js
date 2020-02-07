import React, {Component} from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';
import {SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {TextInput} from 'react-native-gesture-handler';
import {db} from '../../../App';
import {getElevation} from '../../utils/utils';
import NavigationService from '../../services/NavigationService';

import {updateEvent} from '../DialogManager';

export class VaultDialog extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
    };
    this.password = null;
  }

  open = () => {
    this.setState({
      visible: true,
    });
  };
  close = (share = false, item = null) => {
    this.setState(
      {
        visible: false,
      },

      () => {
        if (share && note) {
          let m = `${item.title}\n \n ${item.content.text}`;

          Share.open({
            title: 'Share note to',
            failOnCancel: false,
            message: m,
          });
        }
        updateEvent({type: this.props.note.type});
      },
    );
  };

  onPress = async () => {
    if (this.props.note.locked) {
      let n = db.notes.note(this.props.note.id).data;

      let item;
      if (n.content.cipher) {
        try {
          item = await db.notes.note(n.id).unlock(password, this.props.perm);
        } catch (error) {}
      } else {
        item = n;
      }
      if (!this.props.perm) {
        NavigationService.navigate('Editor', {
          note: item,
        });
      }

      this.close(this.props.shareAfterUnlock, item);
    } else {
      await db.notes.note(this.props.note.id).lock('password');
      this.close();
    }
  };

  render() {
    const {hasPassword, note, colors} = this.props;
    const {visible} = this.state;

    return (
      <Modal visible={visible} transparent={true} onRequestClose={this.close}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.night
              ? 'rgba(255,255,255,0.3)'
              : 'rgba(0,0,0,0.3)',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
          <View
            style={{
              ...getElevation(5),
              width: '80%',
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
              <Icon name="shield" color={colors.accent} size={SIZE.lg} />
              <Text
                style={{
                  color: colors.accent,
                  fontFamily: WEIGHT.bold,
                  marginLeft: 5,
                  fontSize: SIZE.md,
                }}>
                {note.locked ? 'Unlock Note' : 'Lock Note'}
              </Text>
            </View>

            <Text
              style={{
                color: colors.icon,
                fontFamily: WEIGHT.regular,
                textAlign: 'center',
                fontSize: SIZE.sm - 1,
                marginTop: 10,
                //marginBottom: hidden ? 20 : 0,
              }}>
              {hasPassword
                ? 'Set password for all your locked notes.'
                : note.locked
                ? 'Enter vault password to unlock note.'
                : 'Do you want to lock this note?'}
            </Text>

            {note.locked ? (
              <TextInput
                style={{
                  padding: pv - 5,
                  borderWidth: 1.5,
                  borderColor: colors.nav,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  marginTop: 10,
                  fontSize: SIZE.sm,
                  fontFamily: WEIGHT.regular,
                }}
                onChangeText={value => {
                  password = value;
                }}
                secureTextEntry
                placeholder="Password"
                placeholderTextColor={colors.icon}
              />
            ) : null}

            {!hasPassword ? null : (
              <View>
                <TextInput
                  style={{
                    padding: pv - 5,
                    borderWidth: 1.5,
                    borderColor: colors.nav,
                    paddingHorizontal: ph,
                    borderRadius: 5,
                    fontSize: SIZE.sm,
                    fontFamily: WEIGHT.regular,
                  }}
                  onChangeText={value => {}}
                  placeholder="Password"
                  placeholderTextColor={colors.icon}
                />

                <TextInput
                  style={{
                    padding: pv - 5,
                    borderWidth: 1.5,
                    borderColor: colors.nav,
                    paddingHorizontal: ph,
                    borderRadius: 5,
                    fontSize: SIZE.sm,
                    fontFamily: WEIGHT.regular,
                    marginTop: 10,
                  }}
                  onChangeText={value => {}}
                  placeholder="Confirm password"
                  placeholderTextColor={colors.icon}
                />
                <TextInput
                  style={{
                    padding: pv - 5,
                    borderWidth: 1.5,
                    borderColor: colors.nav,
                    paddingHorizontal: ph,
                    borderRadius: 5,
                    fontSize: SIZE.sm,
                    fontFamily: WEIGHT.regular,
                    marginTop: 10,
                  }}
                  onChangeText={value => {}}
                  placeholder="Hint"
                  placeholderTextColor={colors.icon}
                />
              </View>
            )}

            <View
              style={{
                justifyContent: 'space-around',
                alignItems: 'center',
                flexDirection: 'row',
                marginTop: 20,
              }}>
              <TouchableOpacity
                activeOpacity={opacity}
                onPress={this.onPress}
                style={{
                  paddingVertical: pv,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  width: '45%',
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
                  {note.locked ? 'Unlock' : 'Lock'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={opacity}
                onPress={this.close}
                style={{
                  paddingVertical: pv,
                  paddingHorizontal: ph,
                  borderRadius: 5,
                  width: '45%',
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
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }
}
