import React, {Component} from 'react';
import {
  Modal,
  Text,
  TouchableOpacity,
  View,
  DeviceEventEmitter,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import {db} from '../../../App';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider';
import NavigationService from '../../services/NavigationService';
import {getElevation, ToastEvent, w} from '../../utils/utils';
import {dialogActions, updateEvent} from '../DialogManager';
import * as Animatable from 'react-native-animatable';
import {Menu} from '../Menu';

export class ModalMenu extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      showMenu: false,
    };
  }

  componentDidMount() {
    DeviceEventEmitter.addListener('modalMenuShow', this.show);
  }

  componentWillUnmount() {
    DeviceEventEmitter.removeListener('modalMenuShow', this.show);
  }

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
    this.setState(
      {
        showMenu: false,
      },
      () => {
        setTimeout(() => {
          this.setState({
            visible: 'false',
          });
        }, 200);
      },
    );
  };

  render() {
    const {colors} = this.props;
    const {visible, showMenu} = this.state;
    return (
      <Modal
        visible={visible}
        transparent={true}
        animated
        onShow={() => {
          setTimeout(() => {
            this.setState({
              showMenu: true,
            });
          }, 0);
        }}
        animationType="fade"
        onRequestClose={() => this.setState({visible: false})}>
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.2)',
            justifyContent: 'center',
            alignItems: 'flex-start',
          }}>
          <TouchableOpacity
            onPress={this.hide}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
            }}
          />
          <Animatable.View
            transition={['translateX']}
            useNativeDriver={true}
            duration={300}
            style={{
              ...getElevation(10),
              width: 300,
              height: '100%',
              backgroundColor: colors.bg,
              zIndex: 10,
              transform: [
                {
                  translateX: showMenu ? 0 : -(w * 0.3),
                },
              ],
            }}>
            <Menu hasCloseButton={true} noTextMode={false} close={this.hide} />
          </Animatable.View>
        </View>
      </Modal>
    );
  }
}
