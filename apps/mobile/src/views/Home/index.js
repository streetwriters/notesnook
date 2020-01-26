import React, {useEffect} from 'react';
import {SafeAreaView} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS} from '../../../App';
import Container from '../../components/Container';
import {NotesList} from '../../components/NotesList';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import NavigationService from '../../services/NavigationService';
import {SideMenuEvent} from '../../utils/utils';

export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const Home = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes} = state;

  const isFocused = useIsFocused();

  useEffect(() => {
    dispatch({type: ACTIONS.NOTES});
  }, [isFocused]);

  return (
    <Container
      bottomButtonText="Add a new note"
      bottomButtonOnPress={() => {
        if (DDS.isTab) {
          eSendEvent(eOnLoadNote, {type: 'new'});
        } else {
          SideMenuEvent.close();
          SideMenuEvent.disable();
          NavigationService.navigate('Editor');
        }
      }}
      data={notes ? notes : []}>
      <NotesList isGrouped={true} />
    </Container>
  );
};

Home.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default Home;
