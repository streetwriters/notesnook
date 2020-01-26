import React from 'react';
import {Modal, DeviceEventEmitter, View, TouchableOpacity} from 'react-native';
import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import {ACTIONS} from '../../provider/actions';
import {updateEvent} from '../DialogManager';
import * as Animatable from 'react-native-animatable';
import Login from '../../views/Login';
import Signup from '../../views/Signup';
import ForgotPassword from '../../views/ForgotPassword';
import {DDS} from '../../../App';
import {getElevation, w} from '../../utils/utils';
import {eSendEvent} from '../../services/eventManager';
import {eLoginDialogNavigateBack} from '../../services/events';

const fade = props => {
  const {position, scene} = props;

  const index = scene.index;

  const translateX = 0;
  const translateY = 0;

  const opacity = position.interpolate({
    inputRange: [index - 0.7, index, index + 0.7],
    outputRange: [0.7, 1, 0.7],
  });

  return {
    opacity,
    transform: [{translateX}, {translateY}],
  };
};

const ModalNavigator = createStackNavigator(
  {
    Login: {
      screen: Login,
    },
    Signup: {
      screen: Signup,
    },
    ForgotPassword: {
      screen: ForgotPassword,
    },
  },
  {
    initialRouteName: 'Login',
    defaultNavigationOptions: {
      gesturesEnabled: false,
      headerStyle: {
        backgroundColor: 'transparent',
        borderBottomWidth: 0,
        height: 0,
      },
    },
    transitionConfig: () => ({
      screenInterpolator: props => {
        return fade(props);
      },
    }),
  },
);

const Navigator = createAppContainer(ModalNavigator);

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
              width: DDS.isTab ? 600 : '100%',
              height: DDS.isTab ? 500 : '100%',
              borderRadius: DDS.isTab ? 5 : 0,
              backgroundColor: colors.bg,
              padding: 8,
              paddingVertical: 16,
              zIndex: 10,
            }}>
            <Navigator
              ref={ref => (this.navigation = ref)}
              onNavigationStateChange={state => {
                this.routeIndex = state.index;
                console.log(state);
              }}
            />
          </View>
        </Animatable.View>
      </Modal>
    );
  }
}

export default LoginDialog;
