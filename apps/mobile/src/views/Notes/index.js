import {groupArray} from 'notes-core/utils/grouping';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {ContainerTopSection} from '../../components/Container/ContainerTopSection';
import {Header} from '../../components/Header';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {useNoteStore} from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {editing, InteractionManager} from '../../utils';
import {db} from '../../utils/database';
import {
  eOnLoadNote,
  eOpenAddTopicDialog,
  refreshNotesPage
} from '../../utils/Events';
import {openLinkInBrowser} from '../../utils/functions';
import {tabBarRef} from '../../utils/Refs';
import {getNote} from '../Editor/Functions';

const getNotes = params => {
  if (!params) return [];
  let notes = [];
  if (params.type !== 'topic' && params.get !== 'monographs') {
    notes = db.notes[params.get](params.id);
  } else if (params.get === 'monographs') {
    notes = db.monographs.all;
  } else {
    notes = db.notebooks
      .notebook(params.notebookId)
      ?.topics.topic(params.id)?.all;
  }
  if (!notes) {
    notes = [];
  }

  return groupArray(notes, 'notes');
};

export const Notes = ({route, navigation}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const params = useRef(route?.params);
  const [notes, setNotes] = useState(getNotes(params.current) || []);
  const loading = useNoteStore(state => state.loading);
  const alias =
    params.current?.type === 'tag'
      ? db.tags.alias(params.current?.id)
      : params.current?.type === 'color'
      ? db.colors.alias(params.current?.id)
      : params.current?.title;

  const onLoad = () => {
    let _notes = getNotes(params.current);
    setNotes(_notes);
    if (!params.current) return;
    if (
      (params.current.type === 'tag' || params.current.type === 'color') &&
      (!_notes || _notes.length === 0)
    ) {
      Navigation.goBack();
    }
    updateSearch();
  };

  useEffect(() => {
    eSubscribeEvent(refreshNotesPage, init);
    return () => {
      eUnSubscribeEvent(refreshNotesPage, init);
      editing.actionAfterFirstSave = {
        type: null
      };
    };
  }, []);

  const setActionAfterFirstSave = () => {
    if (params.current?.get === 'monographs') return;
    editing.actionAfterFirstSave = {
      type: params.current?.type,
      id: params.current?.id,
      notebook: params.current?.notebookId
    };
  };

  const init = data => {
    if (data) params.current = data;

    setActionAfterFirstSave();
    onLoad();
    Navigation.setHeaderState('NotesPage', params, {
      heading:
        params.current?.type === 'tag'
          ? '#' + alias
          : alias.slice(0, 1).toUpperCase() + alias.slice(1),
      id: params.current?.id,
      type: params.current?.type
    });
  };

  const onFocus = () => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('NotesPage', init);
    }, 150);
  };

  const onBlur = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setNotes([]);
    }, 150);
    editing.actionAfterFirstSave = {
      type: null
    };
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      editing.actionAfterFirstSave = {
        type: null
      };
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
      placeholder: `Search in ${
        params.current?.type === 'tag' ? '#' + alias : alias
      }`,
      data: notes,
      noSearch: false,
      type: 'notes',
      color: params.current?.type === 'color' ? params.current?.title : null,
      title:
        params.current?.type === 'tag'
          ? '#' + alias
          : alias.slice(0, 1).toUpperCase() + alias.slice(1)
    });
  };

  const _onPressBottomButton = async () => {
    if (params.current?.get === 'monographs') {
      try {
        await openLinkInBrowser(
          'https://docs.notesnook.com/monographs/',
          colors.accent
        );
      } catch (e) {}
      return;
    }
    setActionAfterFirstSave();
    if (!DDS.isTab) {
      if (getNote()) {
        eSendEvent(eOnLoadNote, {type: 'new'});
        editing.currentlyEditing = true;
        editing.movedAway = false;
      }
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  };

  const headerProps = {
    heading:
      params.current?.type === 'tag'
        ? '#' + alias
        : alias.slice(0, 1).toUpperCase() + alias.slice(1),
    color:
      params.current?.type === 'color'
        ? params.current?.title.toLowerCase()
        : null,
    paragraph: params.current?.type === 'topic' ? 'Edit topic' : null,
    onPress: () => {
      if (params.current?.type !== 'topic') return;
      eSendEvent(eOpenAddTopicDialog, {
        notebookId: params.current?.notebookId,
        toEdit: params.current
      });
    },
    icon: 'pencil'
  };

  const _refreshCallback = () => {
    init();
  };

  const placeholderData = {
    heading:
      params.current?.get === 'monographs' ? 'Your monographs' : 'Your notes',
    paragraph:
      params.current?.get === 'monographs'
        ? 'You have not published any notes as monographs yet.'
        : 'You have not added any notes yet.',
    button:
      params.current?.get === 'monographs'
        ? 'Learn about monographs'
        : 'Add your first Note',
    action: _onPressBottomButton,
    buttonIcon:
      params.current?.get === 'monographs' ? 'information-outline' : null,
    loading:
      params.current?.get === 'monographs'
        ? 'Loading published notes'
        : 'Loading your notes.'
  };

  const isFocused = () => navigation.isFocused();

  const headerRightButtons = [
    {
      icon: 'pencil',
      title: 'Edit topic',
      func: () => {
        if (params.current?.type !== 'topic') return;
        eSendEvent(eOpenAddTopicDialog, {
          notebookId: params.current?.notebookId,
          toEdit: params.current
        });
      }
    }
  ];

  return (
    <>
      <SelectionHeader
        type={params.current?.type}
        extras={{
          topic: params.current?.id,
          notebook: params.current?.notebookId
        }}
        screen="NotesPage"
      />
      <ContainerTopSection>
        <Header
          title={headerProps.heading}
          isBack={!params.current?.menu}
          screen="NotesPage"
          action={_onPressBottomButton}
          notebook={
            params.current?.notebookId &&
            db.notebooks?.notebook(params.current?.notebookId).data
          }
          rightButtons={
            params.current?.type !== 'topic' ? null : headerRightButtons
          }
        />
      </ContainerTopSection>
      <SimpleList
        listData={notes || []}
        type="notes"
        screen="NotesPage"
        refreshCallback={_refreshCallback}
        headerProps={headerProps}
        loading={loading}
        focused={isFocused}
        placeholderText={`Add some notes to this" ${
          params.current?.type ? params.current?.type : 'topic.'
        }`}
        placeholderData={placeholderData}
      />
      {params.current?.get === 'monographs' ? null : (
        <ContainerBottomButton
          title="Create a new note"
          onPress={_onPressBottomButton}
          color={params.current?.type == 'color' ? params.current?.title : null}
        />
      )}
    </>
  );
};

export default Notes;
