import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {scrollRef} from '../../utils';
import {eOnLoadNote, eScrollEvent} from '../../utils/Events';
import {rootNavigatorRef, tabBarRef} from '../../utils/Refs';

export const Home = ({route,navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes, loading} = state;

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
      screen: 'notes',
    });
    dispatch({
      type: Actions.CONTAINER_BOTTOM_BUTTON,
      state: {
        onPress: _onPressBottomButton,
      },
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
  }, []);

  useEffect(() => {
    console.log('rerender')
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notes,route.params]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Search in notes',
      data: notes,
      type: 'notes',
    });
  };

  const _onPressBottomButton = (event) => {
  
    if (!DDS.isLargeTablet()) {
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
        loading={loading}
        sortMenuButton={true}
        placeholderText={`Notes you write appear here`}
        jumpToDialog={true}
        placeholderData={{
          heading: 'Your Notes',
          paragraph: 'You have not added any notes yet.',
          button: 'Add your First Note',
          action: _onPressBottomButton,
          loading: 'We are loading your notes.',
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
