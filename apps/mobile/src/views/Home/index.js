import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import SearchService from '../../services/SearchService';
import {scrollRef} from '../../utils';
import {
  eOnLoadNote,
  eScrollEvent,
  eUpdateSearchState,
} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';

export const Home = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes} = state;

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {name: 'Notes', type: 'in'});
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: 'Notes',
      },
    });
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'home',
    });
    dispatch({
      type: Actions.HEADER_STATE,
      state: true,
    });
    updateSearch();

    dispatch({type: Actions.COLORS});
    dispatch({type: Actions.NOTES});
  }, [notes]);

  const onBlur = useCallback(() => {}, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      eSendEvent(eScrollEvent, {name: 'Notes', type: 'back'});
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notes]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in notes',
      data: notes,
      type: 'notes',
    });
  };

  const _onPressBottomButton = async (event) => {
    if (DDS.isPhone || DDS.isSmallTab) {
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  };

  return (
    <>
      <SimpleList
        data={notes}
        scrollRef={scrollRef}
        type="notes"
        isHome={true}
        pinned={true}
        sortMenuButton={true}
        placeholderText={`Notes you write appear here`}
        jumpToDialog={true}
        placeholderData={{
          heading: 'Your Notes',
          paragraph: 'You have not added any notes yet.',
          button: 'Add your First Note',
          action: _onPressBottomButton,
        }}
      />

      {!notes || notes.length === 0 ? null : (
        <ContainerBottomButton
          title="Create a new note"
          onPress={_onPressBottomButton}
        />
      )}
    </>
  );
};

export default Home;
