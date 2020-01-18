import React from 'react';
import {Modal, DeviceEventEmitter} from 'react-native';
import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import {ACTIONS} from '../../provider';
import Folders from '../../views/Folders';
import Notebook from '../../views/Notebook';
import Notes from '../../views/Notes';
import {updateEvent} from '../DialogManager';
import * as Animatable from 'react-native-animatable';

const fade = props => {
  const {position, scene} = props;

  const index = scene.index;

  const translateX = 0;
  const translateY = 0;

  const opacity = position.interpolate({
    inputRange: [index - 0.7, index, index + 0.7],
    outputRange: [0.3, 1, 0.3],
  });

  return {
    opacity,
    transform: [{translateX}, {translateY}],
  };
};

const ModalNavigator = createStackNavigator(
  {
    Folders: {
      screen: Folders,
    },
    Notebook: {
      screen: Notebook,
    },
    Notes: {
      screen: Notes,
    },
  },
  {
    initialRouteName: 'Folders',
    initialRouteParams: {
      title: 'Select Notebook',
      isMove: true,
      hideMore: true,
      canGoBack: true,
    },
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

class MoveNoteDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      animated: false,
    };
    this.routeName = null;
    this.count = 0;
  }

  open() {
    console.log(' i am called');
    this.setState({
      visible: true,
    });
  }

  close() {
    updateEvent({type: ACTIONS.CLEAR_SELECTION});
    updateEvent({type: ACTIONS.MODAL_NAVIGATOR, enabled: false});
    this.setState({
      visible: false,
      animated: false,
    });
  }

  render() {
    const {visible, animated} = this.state;
    return (
      <Modal
        animated={true}
        animationType="fade"
        onShow={() => {
          updateEvent({type: ACTIONS.MODAL_NAVIGATOR, enabled: true});
          this.setState({
            animated: true,
          });
        }}
        onRequestClose={() => {
          if (!this.routeName || this.routeName === 0) {
            this.close();
          } else {
            DeviceEventEmitter.emit('goBack');
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
            backgroundColor: 'white',
            transform: [
              {
                scaleX: animated ? 1 : 0.95,
              },
              {
                scaleY: animated ? 1 : 0.95,
              },
            ],
          }}>
          <Navigator
            ref={ref => (this.navigation = ref)}
            onNavigationStateChange={state => {
              this.routeName = state.index;
              console.log(state);
            }}
          />
        </Animatable.View>
      </Modal>
    );
  }
}

export default MoveNoteDialog;
