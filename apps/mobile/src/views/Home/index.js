import React, {useEffect} from 'react';
import {SafeAreaView} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS, db} from '../../../App';
import Container from '../../components/Container';
import {NotesList} from '../../components/NotesList';
import SelectionHeader from '../../components/SelectionHeader';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import NavigationService from '../../services/NavigationService';
import {SideMenuEvent} from '../../utils/utils';
import {eScrollEvent, eOnLoadNote} from '../../services/events';
import {openEditorAnimation} from '../../utils/animations';
let count = 0;
export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const Home = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes} = state;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'home',
      });
    }

    eSendEvent(eScrollEvent, 0);
    dispatch({type: ACTIONS.COLORS});
    dispatch({type: ACTIONS.NOTES});
  }, [isFocused]);

  return (
    <Container
      bottomButtonText="Create a new note"
      heading="Home"
      customIcon="menu"
      verticalMenu
      type="notes"
      menu
      placeholder="Search all notes"
      canGoBack={false}
      bottomButtonOnPress={() => {
        if (DDS.isTab) {
          eSendEvent(eOnLoadNote, {type: 'new'});
        } else {
          SideMenuEvent.close();
          SideMenuEvent.disable();
          eSendEvent(eOnLoadNote, {type: 'new'});
          openEditorAnimation();
        }
      }}
      data={notes ? notes : []}>
      <SelectionHeader />

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
