import React, { useCallback, useEffect } from 'react';
import { ContainerHeader } from '../../components/container/containerheader';
import { FloatingButton } from '../../components/container/floating-button';
import { Header } from '../../components/header/index';
import List from '../../components/list';
import SelectionHeader from '../../components/selection-header';
import { DDS } from '../../services/device-detection';
import { eSendEvent } from '../../services/event-manager';
import Navigation from '../../services/navigation';
import SearchService from '../../services/search';
import { useNoteStore } from '../../stores/stores';
import { InteractionManager } from '../../utils';
import { db } from '../../utils/database';
import { eOnLoadNote } from '../../utils/events';
import { tabBarRef } from '../../utils/global-refs';
import { getNote } from '../editor/Functions';
import { editorController, editorState } from '../editor/tiptap/utils';

export const Home = ({ navigation }) => {
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
        menu: true
      },
      {
        heading: 'Notes',
        id: 'notes_navigation'
      }
    );
  }, []);

  const onBlur = useCallback(() => {}, []);

  const runAfterInteractions = () => {
    updateSearch();

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
      get: () => db.notes.all
    });
  };

  const _onPressBottomButton = React.useCallback(async () => {
    if (!DDS.isTab) {
      if (!editorController.current?.note) {
        eSendEvent(eOnLoadNote, { type: 'new' });
        editorState().currentlyEditing = true;
        editorState().movedAway = false;
      }
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, { type: 'new' });
    }
  }, []);

  return (
    <>
      <SelectionHeader screen="Notes" />
      <ContainerHeader>
        <Header title="Notes" isBack={false} screen="Notes" action={_onPressBottomButton} />
      </ContainerHeader>

      <List
        listData={notes}
        type="notes"
        isHome={true}
        pinned={true}
        screen="Notes"
        loading={loading}
        sortMenuButton={true}
        headerProps={{
          heading: 'Notes'
        }}
        placeholderText={`Notes you write appear here`}
        jumpToDialog={true}
        placeholderData={{
          heading: 'Notes',
          paragraph: 'You have not added any notes yet.',
          button: 'Add your first note',
          action: _onPressBottomButton,
          loading: 'Loading your notes'
        }}
      />

      {!notes || notes.length === 0 ? null : (
        <FloatingButton title="Create a new note" onPress={_onPressBottomButton} />
      )}
    </>
  );
};

export default Home;
