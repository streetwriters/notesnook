import React, {createRef} from 'react';
import {Modal, TouchableOpacity, View} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eMoveNoteDialogNavigateBack} from '../../services/events';
import {getElevation, DDS} from '../../utils/utils';
import Folders from '../../views/Folders';
import Notebook from '../../views/Notebook';
import Notes from '../../views/Notes';
import {updateEvent} from '../DialogManager/recievers';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

const Stack = createStackNavigator();
const modalNavigatorRef = createRef();
const ModalNavigator = ({onStateChange}) => {
  return (
    <NavigationContainer onStateChange={onStateChange} independent={true} ref={modalNavigatorRef}>
      <Stack.Navigator
        initialRouteName="Folders"
        screenOptions={{
          headerShown: false,
          animationEnabled: false,
          gestureEnabled: false,
          cardOverlayEnabled: false,
          cardShadowEnabled: false,
        }}>
        <Stack.Screen
          name="Folders"
          component={Folders}
          initialParams={{
            title: 'Select Notebook',
            isMove: true,
            hideMore: true,
            canGoBack: true,
          }}
        />
        <Stack.Screen name="Notes" component={Notes} />
        <Stack.Screen name="Notebook" component={Notebook} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

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
              flex: 1,
              borderRadius: DDS.isTab ? 5 : 0,
              backgroundColor: colors.bg,
              padding: DDS.isTab ? 8 : 0,
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

export default MoveNoteDialog;
