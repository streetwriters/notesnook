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
import {tabBarRef} from '../../utils/Refs';

export const Home = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes, loading} = state;
  let pageIsLoaded = false;

  const onFocus = useCallback(() => {
    updateSearch();
    eSendEvent(eScrollEvent, {name: 'Notes', type: 'in'});
    
    if (DDS.isLargeTablet()) {
      dispatch({
        type: Actions.CONTAINER_BOTTOM_BUTTON,
        state: {
          onPress: _onPressBottomButton,
        },
      });
    }

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }

    Navigation.setHeaderState(
      'notes',
      {
        menu: true,
      },
      {
        heading: 'Notes',
        id: 'notes_navigation',
      },
    );
    //dispatch({type: Actions.NOTES});
  }, []);

  const onBlur = useCallback(() => {}, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      pageIsLoaded = false;
      eSendEvent(eScrollEvent, {name: 'Notes', type: 'back'});
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    console.log('rerender');
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notes, route.params]);

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
        headerProps={{
          heading: "Home",
        }}
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
