import React, {useEffect, useState, createRef, Component} from 'react';
import {View, Text, TouchableOpacity, Modal} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {getElevation, ToastEvent} from '../../utils/utils';
import {dialogActions, updateEvent} from '../DialogManager';
import {db} from '../../../App';

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
        await db.deleteNotes([item]);
        ToastEvent.show('Note moved to trash', 'success', 3000);
        updateEvent({type: item.type});

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
            onPress={() => close()}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
          />
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
