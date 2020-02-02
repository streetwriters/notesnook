import React from 'react';
import {Modal, DeviceEventEmitter, View, TouchableOpacity} from 'react-native';
import {createAppContainer} from 'react-navigation';
import {createStackNavigator} from 'react-navigation-stack';
import {ACTIONS} from '../../provider/actions';
import Folders from '../../views/Folders';
import Notebook from '../../views/Notebook';
import Notes from '../../views/Notes';
import {updateEvent} from '../DialogManager';
import * as Animatable from 'react-native-animatable';
import {DDS} from '../../../App';
import {getElevation} from '../../utils/utils';
import {eSendEvent} from '../../services/eventManager';
import {eMoveNoteDialogNavigateBack} from '../../services/events';

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
    this.routeIndex = 0;
    this.count = 0;
  }

  open() {
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
    const {colors} = this.props;
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
          if (!this.routeIndex || this.routeIndex === 0) {
            this.close();
          } else {
            eSendEvent(eMoveNoteDialogNavigateBack);
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
              width: DDS.isTab ? '65%' : '100%',
              height: DDS.isTab ? '90%' : '100%',
              borderRadius: DDS.isTab ? 5 : 0,
              backgroundColor: colors.bg,
              padding: DDS.isTab ? 8 : 0,
              zIndex: 10,
            }}>
            <Navigator
              ref={ref => (this.navigation = ref)}
              onNavigationStateChange={state => {
                this.routeIndex = state.index;
              }}
            />
          </View>
        </Animatable.View>
      </Modal>
    );
  }
}

export default MoveNoteDialog;
