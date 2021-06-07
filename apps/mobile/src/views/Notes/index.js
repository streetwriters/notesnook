import React, {useCallback, useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {ContainerTopSection} from '../../components/Container/ContainerTopSection';
import {Header} from '../../components/Header';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import { useNoteStore } from '../../provider/stores';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {editing, InteractionManager} from '../../utils';
import {db} from '../../utils/DB';
import {
  eOnLoadNote,
  eOpenAddTopicDialog,
  eScrollEvent,
  refreshNotesPage,
} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';

export const Notes = ({route, navigation}) => {
  const [notes, setNotes] = useState([]);
  const loading = useNoteStore(state =>state.loading);
  
  let params = route.params ? route.params : null;
  let ranAfterInteractions = false;

  const runAfterInteractions = (time = 300) => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('NotesPage', () => {
        init();
      });
    }, time);

    let _notes = [];
    if (params.type !== 'topic') {
      _notes = db.notes[params.get](params?.id);
    } else {
      _notes = db.notebooks.notebook(params.notebookId)?.topics.topic(params.id)
        ?.all;
    }
    if (
      (params.type === 'tag' || params.type === 'color') &&
      (!_notes || _notes.length === 0)
    ) {
      Navigation.goBack();
    }
    console.log('setting notes');
    setNotes(_notes);
    if (params.menu) {
      navigation.setOptions({
        animationEnabled: true,
        gestureEnabled: false,
      });
    } else {
      navigation.setOptions({
        animationEnabled: true,
        gestureEnabled: Platform.OS === 'ios',
      });
    }
    updateSearch();
    ranAfterInteractions = false;
  };

  useEffect(() => {
    eSubscribeEvent(refreshNotesPage, init);
    return () => {
      ranAfterInteractions = false;
      eUnSubscribeEvent(refreshNotesPage, init);
      editing.actionAfterFirstSave = {
        type: null,
      };
    };
  }, []);

  const setActionAfterFirstSave = () => {
    editing.actionAfterFirstSave = {
      type: params.type,
      id: params.id,
      notebook: params.notebookId,
    };
  };

  const init = data => {
    if (data) {
      params = data;
    }
    setActionAfterFirstSave();
    if (!ranAfterInteractions) {
      ranAfterInteractions = true;
      runAfterInteractions(data ? 300 : 1);
    }
    Navigation.setHeaderState('NotesPage', params, {
      heading:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      id: params.id,
      type: params.type,
    });
  };

  const onFocus = () => {
    init();
    eSendEvent(eScrollEvent, {
      name:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      type: 'in',
    });
  };

  const onBlur = useCallback(() => {
    setNotes([]);
    editing.actionAfterFirstSave = {
      type: null,
    };
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      eSendEvent(eScrollEvent, {
        name:
          params.type === 'tag'
            ? '#' + params.title
            : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
        type: 'hide',
      });
      editing.actionAfterFirstSave = {
        type: null,
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
        params.type === 'tag' ? '#' + params.title : params.title
      }`,
      data: notes,
      noSearch: false,
      type: 'notes',
      color: params.type === 'color' ? params.title : null,
      title:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
    });
  };

  const _onPressBottomButton = () => {
    setActionAfterFirstSave();
    if (DDS.isPhone || DDS.isSmallTab) {
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  };

  const headerProps = {
    heading:
      params.type === 'tag'
        ? '#' + params.title
        : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
    color: params.type === 'color' ? params.title.toLowerCase() : null,
    paragraph:
      route.params.type === 'topic' && route.params.title !== 'General'
        ? 'Edit topic'
        : null,
    onPress: () => {
      if (route.params.type !== 'topic') return;
      eSendEvent(eOpenAddTopicDialog, {
        notebookId: route.params.notebookId,
        toEdit: route.params,
      });
    },
    icon: 'pencil',
  };

  const _refreshCallback = () => {
    init();
  };

  const placeholderData = {
    heading: 'Your notes',
    paragraph: 'You have not added any notes yet.',
    button: 'Add your first Note',
    action: _onPressBottomButton,
    loading: 'Loading your notes.',
  };

  const isFocused = () => navigation.isFocused();

  return (
    <>
      <SelectionHeader
        type={params.type}
        extras={{
          topic: params.id,
          notebook: params.notebookId,
        }}
        screen="NotesPage"
      />
      <ContainerTopSection>
        <Header
          title={headerProps.heading}
          isBack={!params.menu}
          screen="NotesPage"
          action={_onPressBottomButton}
        />
      </ContainerTopSection>
      <SimpleList
        listData={notes}
        type="notes"
        screen="NotesPage"
        refreshCallback={_refreshCallback}
        headerProps={headerProps}
        loading={loading}
        focused={isFocused}
        placeholderText={`Add some notes to this" ${
          params.type ? params.type : 'topic.'
        }`}
        placeholderData={placeholderData}
      />
      <ContainerBottomButton
        title="Create a new note"
        onPress={_onPressBottomButton}
        color={params.type == 'color' ? params.title : null}
      />
    </>
  );
};

export default Notes;
