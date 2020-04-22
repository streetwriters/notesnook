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
    };
    this.dateCreated = null;
  }
  setDateEdited(id) {
    console.log(id);
    this.setState(
      {
        saving: true,
      },
      () => {
        setTimeout(() => {
          this.setState({
            dateEdited: id,
            saving: false,
          });
        }, 500);
      },
    );
  }
  setDateCreated(dateCreated) {
    this.dateCreated = dateCreated;
  }

  render() {
    return (
      <View
        style={{
          paddingHorizontal: 12,
          marginTop: Platform.OS === 'ios' ? 45 : StatusBar.currentHeight + 45,
          width: '100%',
          position: 'absolute',
          justifyContent: 'flex-start',
          flexDirection: 'row',
          alignItems: 'center',
          paddingLeft: this.props.noMenu ? 12 : 12 + 50,
          zIndex: 999,
        }}>
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
          {timeConverter(this.state.dateEdited)}
        </Text>

        <View
          style={{
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          {this.state.saving ? (
            <ActivityIndicator
              style={{width: 16, height: 16, marginLeft: 10}}
              color="white"
              size={16}
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
