import { groupArray } from 'notes-core/utils/grouping';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ContainerHeader } from '../../components/container/containerheader';
import { FloatingButton } from '../../components/container/floating-button';
import { Header } from '../../components/header';
import List from '../../components/list';
import SelectionHeader from '../../components/selection-header';
import { MoveNotes } from '../../components/sheets/move-notes/movenote';
import { DDS } from '../../services/device-detection';
import { eSendEvent, eSubscribeEvent, eUnSubscribeEvent } from '../../services/event-manager';
import Navigation from '../../services/navigation';
import SearchService from '../../services/search';
import { useMenuStore, useNoteStore } from '../../stores/stores';
import { useThemeStore } from '../../stores/theme';
import { InteractionManager } from '../../utils';
import { db } from '../../utils/database';
import { eOnLoadNote, eOpenAddTopicDialog, refreshNotesPage } from '../../utils/events';
import { openLinkInBrowser } from '../../utils/functions';
import { tabBarRef } from '../../utils/global-refs';
import { editorController, editorState } from '../editor/tiptap/utils';

const getNotes = (params, group = true) => {
  if (!params)
    return {
      notes: [],
      synced: true
    };
  let notes = [];
  let isSynced = true;
  if (params.type !== 'topic' && params.get !== 'monographs') {
    notes = db.notes[params.get](params.id);
  } else if (params.get === 'monographs') {
    notes = db.monographs.all;
  } else {
    notes = db.notebooks.notebook(params.notebookId)?.topics.topic(params.id)?.all;
    isSynced = db.notebooks.notebook(params.notebookId)?.topics.topic(params.id)?.synced();
  }
  if (!notes) {
    notes = [];
  }
  return {
    notes: group ? groupArray(notes, db.settings?.getGroupOptions('notes')) : notes,
    synced: isSynced
  };
};

function getAlias(params) {
  if (!params) return '';
  let alias =
    params.current?.type === 'tag'
      ? db.tags.alias(params.current?.id)
      : params.current?.type === 'color'
      ? db.colors.alias(params.current?.id)
      : params.current?.title;
  return alias || '';
}

async function onNoteCreated(id, params) {
  if (!params.current || !id) return;
  switch (params.current.type) {
    case 'topic': {
      await db.notes.move(
        {
          topic: params.current.id,
          id: params.current.notebook
        },
        id
      );
      editorState().onNoteCreated = null;
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.Notebooks,
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Notebook
      ]);
      break;
    }
    case 'tag': {
      await db.notes.note(id).tag(params.current.id);
      editorState().onNoteCreated = null;
      Navigation.setRoutesToUpdate([Navigation.routeNames.Tags, Navigation.routeNames.NotesPage]);
      break;
    }
    case 'color': {
      await db.notes.note(id).color(params.current.id);
      editorState().onNoteCreated = null;
      Navigation.setRoutesToUpdate([Navigation.routeNames.NotesPage]);
      useMenuStore.getState().setColorNotes();
      break;
    }
    default: {
      break;
    }
  }
}
function getIsSynced(params) {
  if (params.type === 'topic') {
    let topic = db.notebooks.notebook(params.notebookId)?.topics.topic(params.id);
    return !topic ? true : topic?.synced();
  }
  return true;
}

export const Notes = ({ route, navigation }) => {
  const colors = useThemeStore(state => state.colors);
  const params = useRef(route?.params);
  const [notes, setNotes] = useState(getNotes(params.current).notes || []);
  const loading = useNoteStore(state => state.loading);
  const alias = getAlias(params);
  const [warning, setWarning] = useState(!getIsSynced(params.current));

  const onLoad = () => {
    let data = getNotes(params.current);
    let _notes = data.notes;
    setWarning(!data.synced);
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
      editorState().onNoteCreated = null;
    };
  }, []);

  const setActionAfterFirstSave = () => {
    if (params.current?.get === 'monographs') return;
    editorState().onNoteCreated = id => onNoteCreated(id, params);
  };

  const init = data => {
    if (data) params.current = data;

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
    setActionAfterFirstSave();
    InteractionManager.runAfterInteractions(() => {
      Navigation.routeNeedsUpdate('NotesPage', init);
    }, 150);
  };

  const onBlur = useCallback(() => {
    InteractionManager.runAfterInteractions(() => {
      setNotes([]);
    }, 150);
    editorState().onNoteCreated = null;
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      editorState().onNoteCreated = null;
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  }, []);

  useEffect(() => {
    if (navigation?.isFocused()) {
      updateSearch();
    }
  }, [notes]);

  const updateSearch = () => {
    SearchService.update({
      placeholder: `Search in ${params.current?.type === 'tag' ? '#' + alias : alias}`,
      data: notes,
      noSearch: false,
      type: 'notes',
      color: params.current?.type === 'color' ? params.current?.title : null,
      title:
        params.current?.type === 'tag'
          ? '#' + alias
          : alias.slice(0, 1).toUpperCase() + alias.slice(1),

      get: () => {
        return getNotes(params.current, false).notes;
      }
    });
  };

  const _onPressBottomButton = async () => {
    if (params.current?.get === 'monographs') {
      try {
        await openLinkInBrowser('https://docs.notesnook.com/monographs/', colors.accent);
      } catch (e) {}
      return;
    }
    setActionAfterFirstSave();
    if (!DDS.isTab) {
      if (editorController.current?.note) {
        eSendEvent(eOnLoadNote, { type: 'new' });
        editorState().currentlyEditing = true;
        editorState().movedAway = false;
      }
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, { type: 'new' });
    }
  };

  const headerProps = {
    heading:
      params.current?.type === 'tag'
        ? '#' + alias
        : alias.slice(0, 1).toUpperCase() + alias.slice(1),
    color: params.current?.type === 'color' ? params.current?.title.toLowerCase() : null,
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
    heading: params.current?.get === 'monographs' ? 'Your monographs' : 'Your notes',
    paragraph:
      params.current?.get === 'monographs'
        ? 'You have not published any notes as monographs yet.'
        : 'You have not added any notes yet.',
    button:
      params.current?.get === 'monographs' ? 'Learn more about monographs' : 'Add your first Note',
    action: _onPressBottomButton,
    buttonIcon: params.current?.get === 'monographs' ? 'information-outline' : null,
    loading:
      params.current?.get === 'monographs' ? 'Loading published notes' : 'Loading your notes.',
    type: params.current?.get === 'monographs' ? 'monographs' : null
  };

  const isFocused = () => navigation.isFocused();

  const headerRightButtons = [
    {
      title: 'Edit topic',
      func: () => {
        if (params.current?.type !== 'topic') return;
        eSendEvent(eOpenAddTopicDialog, {
          notebookId: params.current?.notebookId,
          toEdit: params.current
        });
      }
    },
    {
      title: 'Move notes',
      func: () => {
        if (params.current?.type !== 'topic') return;
        MoveNotes.present(db.notebooks.notebook(params.current?.notebookId).data, params.current);
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
      <ContainerHeader>
        <Header
          title={headerProps.heading}
          isBack={!params.current?.menu}
          screen="NotesPage"
          action={_onPressBottomButton}
          notebook={
            params.current?.notebookId && db.notebooks?.notebook(params.current?.notebookId).data
          }
          rightButtons={params.current?.type !== 'topic' ? null : headerRightButtons}
        />
      </ContainerHeader>
      <List
        listData={notes || []}
        type="notes"
        screen="NotesPage"
        warning={
          warning
            ? {
                title: 'Some notes in this topic are not synced'
              }
            : null
        }
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
        <FloatingButton
          title="Create a new note"
          onPress={_onPressBottomButton}
          color={params.current?.type == 'color' ? params.current?.title : null}
        />
      )}
    </>
  );
};

export default Notes;
