import React, { createRef } from 'react';
import {Modal, TouchableOpacity, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {normalize} from '../../common/common';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eLoginDialogNavigateBack} from '../../services/events';
import {getElevation, DDS} from '../../utils/utils';
import ForgotPassword from '../../views/ForgotPassword';
import Login from '../../views/Login';
import Signup from '../../views/Signup';
import {updateEvent} from '../DialogManager/recievers';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

const Stack = createStackNavigator();

const modalNavigatorRef2 = createRef();
const ModalNavigator = ({onStateChange}) => {
  return (
    <NavigationContainer onStateChange={onStateChange} independent={true} ref={modalNavigatorRef2}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
          gestureEnabled: false,
          cardOverlayEnabled: false,
          cardShadowEnabled: false,
        }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Signup" component={Signup} />
        <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

class LoginDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      animated: false,
    };
    this.routeIndex = 0;
    this.count = 0;
  }

  open() {
    updateEvent({type: ACTIONS.LOGIN_NAVIGATOR, enabled: true});
    this.setState({
      visible: true,
    });
  }

  close() {
    this.setState({
      visible: false,
      animated: false,
    });
  }

  render() {
    const {visible, animated} = this.state;
    const {colors} = this.props;
    return (
      <Modal
        animated={true}
        animationType="fade"
        onShow={() => {
          this.setState({
            animated: true,
          });
        }}
        onRequestClose={() => {
          if (!this.routeIndex || this.routeIndex === 0) {
            updateEvent({type: ACTIONS.LOGIN_NAVIGATOR, enabled: false});
            this.close();
          } else {
            eSendEvent(eLoginDialogNavigateBack);
          }
        }}
        visible={visible}
        transparent={true}>
        <Animatable.View
          transition={['opacity', 'scaleX', 'scaleY']}
          useNativeDriver={true}
          duration={300}
          iterationCount={1}
          style={{
            opacity: animated ? 1 : 0,
            flex: 1,
            backgroundColor: DDS.isTab ? 'rgba(0,0,0,0.3)' : colors.bg,
            width: '100%',
            height: '100%',
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            transform: [
              {
                scaleX: animated ? 1 : 0.95,
              },
              {
                scaleY: animated ? 1 : 0.95,
              },
            ],
          }}>
          <TouchableOpacity
            onPress={() => this.close()}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              zIndex: 1,
            }}
          />

          <View
            style={{
              ...getElevation(DDS.isTab ? 10 : 0),
              width: DDS.isTab ? normalize(600) : '100%',
              height: DDS.isTab ? normalize(500) : '100%',
              borderRadius: DDS.isTab ? 5 : 0,
              backgroundColor: colors.bg,
              padding: 8,
              paddingVertical: 16,
              zIndex: 10,
            }}>
            <ModalNavigator
              onStateChange={event => {
                  this.routeIndex = event.index;
              }}
            />
          </View>
        </Animatable.View>
      </Modal>
    );
  }
}

export default LoginDialog;
