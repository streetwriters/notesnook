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
  // State
  const [state, dispatch] = useTracked();
  const {notes, searchResults, keyword} = state;
  const isFocused = useIsFocused();

  // Effects

  useEffect(() => {
    dispatch({type: ACTIONS.NOTES});
  }, [isFocused]);

  // Render

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
      data={notes}>
      <NotesList
        isGrouped={true}
        isSearch={searchResults.length > 0 ? true : false}
        searchResults={searchResults.length > 0 ? searchResults : null}
        keyword={keyword}
      />
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
