import React, {useCallback, useEffect, useState} from 'react';
import {COLORS_NOTE} from '../../common/common';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eOnLoadNote,
  eScrollEvent,
  refreshNotesPage,
} from '../../services/events';
import {openEditorAnimation} from '../../utils/animations';
import {db, DDS, editing} from '../../utils/utils';

export const Notes = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colorNotes} = state;
  const allNotes = state.notes;
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  let params = route.params ? route.params : null;

  useEffect(() => {
    if (isFocused) {
      if (!params) {
        params = {
          title: 'Notes',
        };
      }
      init();
    } else {
      setNotes([]);
      editing.actionAfterFirstSave = {
        type: null,
      };
    }
  }, [isFocused, allNotes, colorNotes]);

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
    eSendEvent(eScrollEvent, 0);
    if (params.type === 'tag') {
      allNotes = db.notes.tagged(params.tag.title);
    } else if (params.type == 'color') {
      allNotes = db.notes.colored(params.color.title);
    } else {
      allNotes = db.notebooks
        .notebook(params.notebookId)
        .topics.topic(params.title).all;
    }
    if (allNotes && allNotes.length > 0) {
      setNotes([...allNotes]);
    }
  };

  const onFocus = useCallback(() => {
    dispatch({
      type: ACTIONS.HEADER_STATE,
      state: {
        type: 'notes',
        menu: params.type === 'color' ? true : false,
        canGoBack: params.type === 'color' ? false : true,
        color: params.type == 'color' ? COLORS_NOTE[params.title] : null,
      },
    });
    dispatch({
      type: ACTIONS.HEADER_VERTICAL_MENU,
      state: false,
    });
    dispatch({
      type: ACTIONS.HEADER_TEXT_STATE,
      state: {
        heading:
          params.type == 'tag'
            ? '# ' + params.title
            : params.title.slice(0, 1).toUpperCase() + params.title.slice(1),
      },
    });
    init();
    dispatch({
      type: ACTIONS.CURRENT_SCREEN,
      screen: params.type === 'color' ? params.color.title : params.type,
    });
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
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      dispatch({
        type: ACTIONS.SEARCH_STATE,
        state: {
          placeholder: `Search in ${
            params.type == 'tag' ? '#' + params.title : params.title
          }`,
          data: notes,
          noSearch: false,
          type: 'notes',
          color: params.type == 'color' ? params.title : null,
        },
      });
    }
  }, [notes]);

  const _onPressBottomButton = useCallback(() => {
    if (params.type === 'tag') {
      editing.actionAfterFirstSave = {
        type: 'tag',
        id: params.tag.title,
      };
    } else if (params.type == 'color') {
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

    if (DDS.isTab) {
      eSendEvent(eOnLoadNote, {type: 'new'});
    }
    openEditorAnimation();
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
        placeholder={<Placeholder type="notes" />}
        placeholderText={`Add some notes to this" ${
          params.type ? params.type : 'topic.'
        }`}
      />
      <ContainerBottomButton
        title="Create a new note"
        onPress={_onPressBottomButton}
        color={params.type == 'color' ? COLORS_NOTE[params.title] : null}
      />
    </>
  );
};

export default Notes;
