import { groupArray } from 'notes-core/utils/grouping';
import React, { useCallback, useEffect, useState } from 'react';
import { ContainerBottomButton } from '../../components/Container/ContainerBottomButton';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import { Header } from '../../components/Header';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { useNoteStore } from '../../provider/stores';
import { DDS } from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import { editing, InteractionManager } from '../../utils';
import { db } from '../../utils/DB';
import {
  eOnLoadNote,
  eOpenAddTopicDialog,
  eScrollEvent,
  refreshNotesPage
} from '../../utils/Events';
import { openLinkInBrowser } from '../../utils/functions';
import { tabBarRef } from '../../utils/Refs';

export const Notes = ({route, navigation}) => {
  const [state] = useTracked();
  const colors = state.colors;
  const [notes, setNotes] = useState([]);
  const loading = useNoteStore(state => state.loading);
  let params = route.params ? route.params : null;
  const alias = params.type === "tag" ? db.tags.alias(params.id) : params.type === "color" ? db.colors.alias(params.id) : params.title

  let ranAfterInteractions = false;


  const runAfterInteractions = (time = 300) => {
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('NotesPage', () => {
        init();
      });
    }, time);

    let _notes = [];
    if (params.type !== 'topic' && params.get !== 'monographs') {
      _notes = db.notes[params.get](params?.id);
    } else if (params.get === 'monographs') {
      _notes = db.monographs.all;
    } else {
      _notes = db.notebooks
        .notebook(params.notebookId)
        ?.topics.topic(params.id)?.all;
    }
    if (!_notes) {
      _notes = [];
    }
    if (
      (params.type === 'tag' || params.type === 'color') &&
      (!_notes || _notes.length === 0)
    ) {
      Navigation.goBack();
    }
    setNotes(groupArray(_notes, 'notes'));
    updateSearch();
    ranAfterInteractions = false;
  };

  useEffect(() => {
    eSubscribeEvent(refreshNotesPage, init);
    return () => {
      ranAfterInteractions = false;
      eUnSubscribeEvent(refreshNotesPage, init);
      editing.actionAfterFirstSave = {
        type: null
      };
    };
  }, []);

  const setActionAfterFirstSave = () => {
    if (params.get === 'monographs') return;
    editing.actionAfterFirstSave = {
      type: params.type,
      id: params.id,
      notebook: params.notebookId
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
          ? '#' + alias 
          : alias.slice(0, 1).toUpperCase() + alias.slice(1),
      id: params.id,
      type: params.type
    });
  };

  const onFocus = () => {
    init();
    eSendEvent(eScrollEvent, {
      name:
        params.type === 'tag'
          ? '#' + alias
          : alias.slice(0, 1).toUpperCase() + alias.slice(1),
      type: 'in'
    });
  };

  const onBlur = useCallback(() => {
    setNotes([]);
    editing.actionAfterFirstSave = {
      type: null
    };
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      eSendEvent(eScrollEvent, {
        name:
          params.type === 'tag'
            ? '#' + alias
            : alias.slice(0, 1).toUpperCase() + alias.slice(1),
        type: 'hide'
      });
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
        params.type === 'tag' ? '#' + alias : alias
      }`,
      data: notes,
      noSearch: false,
      type: 'notes',
      color: params.type === 'color' ? params.title : null,
      title:
        params.type === 'tag'
          ? '#' + alias
          : alias.slice(0, 1).toUpperCase() + alias.slice(1)
    });
  };

  const _onPressBottomButton = async () => {
    if (params.get === 'monographs') {
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
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  };

  const headerProps = {
    heading:
      params.type === 'tag'
        ? '#' + alias
        : alias.slice(0, 1).toUpperCase() + alias.slice(1),
    color: params.type === 'color' ? params.title.toLowerCase() : null,
    paragraph: route.params.type === 'topic' ? 'Edit topic' : null,
    onPress: () => {
      if (route.params.type !== 'topic') return;
      eSendEvent(eOpenAddTopicDialog, {
        notebookId: route.params.notebookId,
        toEdit: route.params
      });
    },
    icon: 'pencil'
  };

  const _refreshCallback = () => {
    init();
  };

  const placeholderData = {
    heading: params.get === 'monographs' ? 'Your monographs' : 'Your notes',
    paragraph:
      params.get === 'monographs'
        ? 'You have not published any notes as monographs yet.'
        : 'You have not added any notes yet.',
    button:
      params.get === 'monographs'
        ? 'Learn about monographs'
        : 'Add your first Note',
    action: _onPressBottomButton,
    buttonIcon: params.get === 'monographs' ? 'information-outline' : null,
    loading:
      params.get === 'monographs'
        ? 'Loading published notes'
        : 'Loading your notes.'
  };

  const isFocused = () => navigation.isFocused();

  const headerRightButtons = [
    {
      icon: 'pencil',
      title: 'Edit topic',
      func: () => {
        if (route.params.type !== 'topic') return;
        eSendEvent(eOpenAddTopicDialog, {
          notebookId: route.params.notebookId,
          toEdit: route.params
        });
      }
    }
  ];

  return (
    <>
      <SelectionHeader
        type={params.type}
        extras={{
          topic: params.id,
          notebook: params.notebookId
        }}
        screen="NotesPage"
      />
      <ContainerTopSection>
        <Header
          title={headerProps.heading}
          isBack={!params.menu}
          screen="NotesPage"
          action={_onPressBottomButton}
          rightButtons={
            route.params.type !== 'topic' ? null : headerRightButtons
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
          params.type ? params.type : 'topic.'
        }`}
        placeholderData={placeholderData}
      />
      {params.get === 'monographs' ? null : (
        <ContainerBottomButton
          title="Create a new note"
          onPress={_onPressBottomButton}
          color={params.type == 'color' ? params.title : null}
        />
      )}
    </>
  );
};

export default Notes;
