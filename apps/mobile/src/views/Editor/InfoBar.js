import React from 'react';
import {View, StatusBar, Text, ActivityIndicator} from 'react-native';
import {db, timeConverter} from '../../utils/utils';
import {simpleDialogEvent} from '../../components/DialogManager/recievers';
import {TEMPLATE_INFO} from '../../components/DialogManager/templates';
import {SIZE, WEIGHT} from '../../common/common';

export default class InfoBar extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dateEdited: null,
      saving: false,
      length: 0,
    };
    this.dateCreated = null;
  }

  setSaving() {
    this.setState(
      {
        saving: true,
      },
      () => {
        setTimeout(() => {
          this.setState({
            saving: false,
          });
        }, 500);
      },
    );
  }

  setDateEdited(id, length) {
    this.setState({
      dateEdited: id,
      length: length,
    });
  }
  setDateCreated(dateCreated) {
    this.dateCreated = dateCreated;
  }
  clear() {
    this.dateCreated = null;
    this.setState({
      saving: false,
      dateEdited: null,
      length: 0,
    });
  }

  render() {
    return (
      <View
        style={{
          paddingHorizontal: 12,
          marginTop: Platform.OS === 'ios' ? 45 : StatusBar.currentHeight + 45,
          width: '100%',
          backgroundColor: this.props.colors.bg,
          position: 'absolute',
          justifyContent: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: this.props.noMenu ? 12 : 12 + 50,
          zIndex: 999,
        }}>
        {this.state.length ? (
          <Text
            style={{
              color: this.props.colors.icon,
              fontSize: SIZE.xxs,
              textAlignVertical: 'center',
              fontFamily: WEIGHT.regular,
              marginRight: 5,
            }}>
            {this.state.length + ' words •'}
          </Text>
        ) : null}

        {this.state.dateEdited ? (
          <Text
            onPress={() => {
              simpleDialogEvent(TEMPLATE_INFO(this.dateCreated));
            }}
            style={{
              color: this.props.colors.icon,
              fontSize: SIZE.xxs,
              textAlignVertical: 'center',
              fontFamily: WEIGHT.regular,
            }}>
            {timeConverter(this.state.dateEdited)} •
          </Text>
        ) : null}

        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          {this.state.saving ? (
            <ActivityIndicator
              style={{width: 14, height: 14, marginLeft: 10}}
              color={this.props.colors.accent}
              size={14}
            />
          ) : null}
          <Text
            style={{
              color: this.props.colors.icon,
              fontSize: SIZE.xxs,
              textAlignVertical: 'center',
              fontFamily: WEIGHT.regular,
              marginLeft: 10,
            }}>
            {this.state.saving ? 'Saving' : ''}
            {this.state.dateEdited && !this.state.saving ? 'Saved' : ''}
          </Text>
        </View>
      </View>
    );
  }
}
