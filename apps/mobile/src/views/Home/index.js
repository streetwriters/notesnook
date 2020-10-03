import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
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

  const onFocus = useCallback(() => {
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
    eSendEvent(eScrollEvent, 0);
    dispatch({type: ACTIONS.COLORS});
    dispatch({type: ACTIONS.NOTES});
  }, []);

  const onBlur = useCallback(() => {
    console.log(navigation.isFocused());
    dispatch({
      type: ACTIONS.HEADER_VERTICAL_MENU,
      state: false,
    });
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
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
  }, [notes]);

  const _onPressBottomButton = async () => {
    if (DDS.isTab) {
      eSendEvent(eOnLoadNote, {type: 'new'});
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
      openEditorAnimation();
    }
  };

  return (
    <>
      <SimpleList
        data={notes}
        type="notes"
        isHome={true}
        pinned={true}
        focused={() => navigation.isFocused()}
        RenderItem={NoteItemWrapper}
        placeholder={<Placeholder type="notes" />}
        placeholderText={`Notes you write appear here`}
      />

      <ContainerBottomButton
        title="Create a new note"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Home;
