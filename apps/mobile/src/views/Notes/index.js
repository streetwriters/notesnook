import React, {useCallback, useEffect, useState} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {editing} from '../../utils';
import {COLORS_NOTE} from '../../utils/Colors';
import {db} from '../../utils/DB';
import {eOnLoadNote, eScrollEvent, refreshNotesPage} from '../../utils/Events';
import {tabBarRef} from '../../utils/Refs';

export const Notes = ({route, navigation}) => {
  const [, dispatch] = useTracked();
  const [notes, setNotes] = useState([]);
  let params = route.params ? route.params : null;
  let pageIsLoaded = false;

  useEffect(() => {
    eSubscribeEvent(refreshNotesPage, init);
    return () => {
      eUnSubscribeEvent(refreshNotesPage, init);
      editing.actionAfterFirstSave = {
        type: null,
      };
    };
  }, []);

  const init = (data) => {
    params = route.params;
    if (data) {
      params = data;
    }
    let allNotes = [];
    if (params.type === 'tag') {
      allNotes = db.notes.tagged(params.tag.title);
    } else if (params.type === 'color') {
      allNotes = db.notes.colored(params.color.title);
    } else {
      allNotes = db.notebooks
        .notebook(params.notebookId)
        .topics.topic(params.title).all;
    }
    if (allNotes && allNotes.length > 0) {
      setNotes([...allNotes]);
    }
    updateSearch();
    dispatch({
      type: Actions.CONTAINER_BOTTOM_BUTTON,
      state: {
        onPress: _onPressBottomButton,
        color: params.type == 'color' ? COLORS_NOTE[params.title] : null,
      },
    });

    if (!pageIsLoaded) {
      pageIsLoaded = true;
      return;
    }

    Navigation.setHeaderState('Notes', params, {
      heading:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      id:
        params.type === 'tag'
          ? params.tag.id
          : params.type === 'topic'
          ? params.id
          : params.type === 'color'
          ? params.color.id
          : null,
      type: params.type,
    });
  };

  const onFocus = useCallback(() => {
    eSendEvent(eScrollEvent, {
      name:
        params.type === 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      type: 'in',
    });
    init();
  }, []);

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
    });
  };

  const _onPressBottomButton = useCallback(() => {
    if (params.type === 'tag') {
      editing.actionAfterFirstSave = {
        type: 'tag',
        id: params.tag.title,
      };
    } else if (params.type === 'color') {
      editing.actionAfterFirstSave = {
        type: 'color',
        id: params.color.id,
      };
    } else {
      editing.actionAfterFirstSave = {
        type: 'topic',
        id: params.title,
        notebook: params.notebookId,
      };
    }

    if (DDS.isPhone || DDS.isSmallTab) {
      tabBarRef.current?.goToPage(1);
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
  }, [params.type]);

  return (
    <>
      <SimpleList
        data={notes}
        type="notes"
        refreshCallback={() => {
          init();
        }}
        focused={() => navigation.isFocused()}
        RenderItem={NoteItemWrapper}
        placeholderText={`Add some notes to this" ${
          params.type ? params.type : 'topic.'
        }`}
        placeholderData={{
          heading: 'Your Notes',
          paragraph: 'You have not added any notes yet.',
          button: 'Add your First Note',
          action: _onPressBottomButton,
        }}
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
