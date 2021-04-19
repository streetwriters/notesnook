import React, {useCallback, useEffect, useState} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {ContainerTopSection} from '../../components/Container/ContainerTopSection';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {InteractionManager, scrollRef} from '../../utils';
import {db} from '../../utils/DB';
import {eOnLoadNote, eScrollEvent} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';
import {Header} from '../../components/Header/index';
import SelectionHeader from '../../components/SelectionHeader';
export const Home = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {loading} = state;
  const [localLoad, setLocalLoad] = useState(true);
  const notes = state.notes.slice();
  let pageIsLoaded = false;
  let ranAfterInteractions = false;

  const onFocus = useCallback(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }
    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }

    Navigation.setHeaderState(
      'Notes',
      {
        menu: true,
      },
      {
        heading: 'Notes',
        id: 'notes_navigation',
      },
    );
  }, []);

  const onBlur = useCallback(() => {}, []);

  const runAfterInteractions = () => {
    InteractionManager.runAfterInteractions(() => {
      if (localLoad) {
        setLocalLoad(false);
      }

      updateSearch();
      eSendEvent(eScrollEvent, {name: 'Notes', type: 'in'});

      Navigation.routeNeedsUpdate('Notes', () => {
        console.log('updating notes as requested');
        dispatch({type: Actions.NOTES});
      });

      if (DDS.isLargeTablet()) {
        dispatch({
          type: Actions.CONTAINER_BOTTOM_BUTTON,
          state: {
            onPress: _onPressBottomButton,
          },
        });
      }
      ranAfterInteractions = false;
    });
  };

  useEffect(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
    }

    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      pageIsLoaded = false;
      ranAfterInteractions = false;
      eSendEvent(eScrollEvent, {name: 'Notes', type: 'back'});
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notes]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: 'Type a keyword to search in notes',
      data: db?.notes?.all,
      type: 'notes',
      title: 'Notes',
    });
  };

  const _onPressBottomButton = async () => {
    if (!DDS.isLargeTablet()) {
      eSendEvent(eOnLoadNote, {type: 'new'});
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  };

  return (
    <>
      <SelectionHeader screen="Notes" />
      <ContainerTopSection>
        <Header
          title="Notes"
          isBack={false}
          screen="Notes"
          action={_onPressBottomButton}
        />
      </ContainerTopSection>

      <SimpleList
        listData={notes}
        scrollRef={scrollRef}
        type="notes"
        isHome={true}
        pinned={true}
        screen="Notes"
        loading={loading || localLoad}
        sortMenuButton={true}
        headerProps={{
          heading: 'Notes',
        }}
        placeholderText={`Notes you write appear here`}
        jumpToDialog={true}
        placeholderData={{
          heading: 'Your notes',
          paragraph: 'You have not added any notes yet.',
          button: 'Add your first note',
          action: _onPressBottomButton,
          loading: 'Loading your notes.',
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
