import {useIsFocused} from '@react-navigation/native';
import React, {useEffect} from 'react';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eOnLoadNote, eScrollEvent} from '../../services/events';
import {openEditorAnimation} from '../../utils/animations';
import {DDS} from '../../utils/utils';
import {Placeholder} from '../../components/ListPlaceholders';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
export const Home = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes} = state;
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'home',
      });
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'notes',
          menu: true,
          canGoBack: false,
          route: route,
          color: null,
          navigation: navigation,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: true,
      });

      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          bottomButtonText: 'Create a new Note',
        },
      });
      dispatch({
        type: ACTIONS.HEADER_TEXT_STATE,
        state: {
          heading: 'Home',
        },
      });

      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          bottomButtonText: 'Create a new note',
          bottomButtonOnPress: async () => {
           /*  let res = await RNHTMLtoPDF.convert({
              html: '<h1>Custom converted PDF Document</h1>',
              fileName: 'test',
              base64: false,
              directory:"Documents"
              
            });
            console.log(res); */
            if (DDS.isTab) {
              eSendEvent(eOnLoadNote, {type: 'new'});
            } else {
              eSendEvent(eOnLoadNote, {type: 'new'});
              openEditorAnimation();
            }
          },
          color: null,
          visible: true,
        },
      });
      eSendEvent(eScrollEvent, 0);
      dispatch({type: ACTIONS.COLORS});
      dispatch({type: ACTIONS.NOTES});
      dispatch({type: ACTIONS.PINNED});
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          placeholder: 'Search all notes',
          data: notes,
          noSearch: false,
          type: 'notes',
          color: null,
        },
      });
    }
  }, [notes, isFocused]);

  return (
    <>
      <SimpleList
        data={notes}
        type="notes"
        isHome={true}
        pinned={true}
        focused={isFocused}
        RenderItem={NoteItemWrapper}
        placeholder={<Placeholder type="notes" />}
        placeholderText={`Notes you write appear here`}
      />
    </>
  );
};

export default Home;
