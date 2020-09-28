import {useIsFocused} from '@react-navigation/native';
import React, {useEffect} from 'react';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eOnLoadNote, eScrollEvent} from '../../services/events';
import {openEditorAnimation} from '../../utils/animations';
import {DDS} from '../../utils/utils';
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
          color: null,
        },
      });
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: true,
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
    } else {
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });
    }
    return () => {
      dispatch({
        type: ACTIONS.HEADER_VERTICAL_MENU,
        state: false,
      });
    };
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
