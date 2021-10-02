import React, { useCallback, useEffect } from 'react';
import RNFetchBlob from 'rn-fetch-blob';
import { ContainerBottomButton } from '../../components/Container/ContainerBottomButton';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import { Header } from '../../components/Header/index';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import { useNoteStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import { eSendEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { editing, InteractionManager, scrollRef } from '../../utils';
import { db } from '../../utils/database';
import { eClearEditor, eOnLoadNote, eScrollEvent } from '../../utils/Events';
import { tabBarRef } from '../../utils/Refs';
import { sleep } from '../../utils/TimeUtils';
import { getNote } from '../Editor/Functions';

export const Home = ({navigation}) => {
  const notes = useNoteStore(state => state.notes);
  const setNotes = useNoteStore(state => state.setNotes);
  const loading = useNoteStore(state => state.loading);

  let ranAfterInteractions = false;

  const onFocus = useCallback(() => {
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions();
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
    updateSearch();
    eSendEvent(eScrollEvent, {name: 'Notes', type: 'in'});

    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('Notes', () => {
        setNotes();
      });
    });
    ranAfterInteractions = false;
  };

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
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

  const _onPressBottomButton = React.useCallback(async () => {
    if (!DDS.isTab) {
      if (getNote()) {
       eSendEvent(eOnLoadNote, {type: 'new'});
       editing.currentlyEditing;
       editing.movedAway = false;
      }
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  }, []);

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
        loading={loading}
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
