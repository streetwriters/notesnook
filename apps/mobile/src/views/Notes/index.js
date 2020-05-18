import {useIsFocused} from '@react-navigation/native';
import React, {useEffect, useState} from 'react';
import SimpleList from '../../components/SimpleList';
import {NotebookItemWrapper} from '../../components/SimpleList/NotebookItemWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
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
import {db, DDS, editing, ToastEvent} from '../../utils/utils';
import { NoteItemWrapper } from '../../components/SimpleList/NoteItemWrapper';
import { Placeholder } from '../../components/ListPlaceholders';

export const Notes = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colorNotes} = state;
  const allNotes = state.notes;
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  let params = route.params ? route.params : null;

  useEffect(() => {
    if (!params) {
      params = {
        title: 'Notes',
      };
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      init();
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: params.type,
      });
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

  const init = data => {
    params = route.params;
    if (data) {
      params = data;
    }
    eSendEvent(eScrollEvent, 0);
    if (params.type === 'tag') {
      let notesInTag = db.notes.tagged(params.tag.title);
      setNotes([...notesInTag]);
    } else if (params.type == 'color') {
      let notesInColors = db.notes.colored(params.color.title);
      setNotes([...notesInColors]);
    } else {
      let allNotes = db.notebooks
        .notebook(params.notebookId)
        .topics.topic(params.title).all;
      if (allNotes && allNotes.length > 0) {
        setNotes([...allNotes]);
      }
    }
  };

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.HEADER_STATE,
        state: {
          type: 'notes',
          menu: params.type === 'color' ? true : false,
          canGoBack: params.type === 'color' ? false : true,
          route: route,
          color: params.type == 'color' ? params.title : null,
          navigation: navigation,
        },
      });
      dispatch({
        type: ACTIONS.CONTAINER_BOTTOM_BUTTON,
        state: {
          visible: true,
          color: params.type == 'color' ? params.title : null,
          bottomButtonOnPress: _bottomBottomOnPress,
          bottomButtonText: 'Create a new note',
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
        screen: params.type,
      });
    } else {
      setNotes([]);
      editing.actionAfterFirstSave = {
        type: null,
      };
    }
  }, [isFocused, allNotes, colorNotes]);

  useEffect(() => {
    if (isFocused) {
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
  }, [notes, isFocused]);

  const _onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.sync();
      init();
      dispatch({type: ACTIONS.USER});
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show('Sync failed, network error', 'error');
    }
  };

  const _bottomBottomOnPress = () => {
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
    } else {
      eSendEvent(eOnLoadNote, {type: 'new'});
      openEditorAnimation();
    }
  };

  return (
    <SimpleList
      data={notes}
      type="notes"
      customRefreshing={refreshing}
      focused={isFocused}
      customRefresh={_onRefresh}
      RenderItem={NoteItemWrapper}
      placeholder={<Placeholder type="notes"/>}
      placeholderText={`Add some notes to this" ${
        params.type ? params.type : 'topic.'
      }`}
    />
  );
};

export default Notes;
