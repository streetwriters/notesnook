import React, {useEffect, useState} from 'react';
import {useIsFocused} from 'react-navigation-hooks';
import Container from '../../components/Container';
import {NotesPlaceHolder} from '../../components/ListPlaceholders';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
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
import {sideMenuRef} from '../../utils/refs';

export const Notes = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, currentEditingNote, colorNotes} = state;
  const allNotes = state.notes;
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  let params = navigation.state ? navigation.state.params : null;

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

  const init = () => {
    console.log(params.color);
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

  const _renderItem = ({item, index}) => (
    <SelectionWrapper
      index={index}
      currentEditingNote={
        currentEditingNote === item.dateCreated ? currentEditingNote : null
      }
      item={item}>
      <NoteItem
        colors={colors}
        customStyle={{
          width: selectionMode ? '90%' : '100%',
          marginHorizontal: 0,
        }}
        currentEditingNote={
          currentEditingNote === item.dateCreated ? currentEditingNote : null
        }
        selectionMode={selectionMode}
        onLongPress={() => {
          if (!selectionMode) {
            dispatch({
              type: ACTIONS.SELECTION_MODE,
              enabled: !selectionMode,
            });
          }
          dispatch({
            type: ACTIONS.SELECTED_ITEMS,
            item: item,
          });
        }}
        update={() => {}}
        item={item}
        index={index}
      />
    </SelectionWrapper>
  );

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
      sideMenuRef.current?.openMenu(false);
      sideMenuRef.current?.setGestureEnabled(false);
      eSendEvent(eOnLoadNote, {type: 'new'});
      openEditorAnimation();
    }
  };

  return (
    <Container
      bottomButtonText="Create a new note"
      canGoBack={false}
      heading={
        params.type == 'tag'
          ? '#' + params.title
          : params.title.slice(0, 1).toUpperCase() + params.title.slice(1)
      }
      headerColor={params.type == 'color' ? params.title : null}
      canGoBack={true}
      data={notes}
      type="notes"
      placeholder={`Search in ${
        params.type == 'tag' ? '#' + params.title : params.title
      }`}
      bottomButtonOnPress={_bottomBottomOnPress}>
      <SimpleList
        data={notes}
        type="notes"
        refreshing={refreshing}
        focused={isFocused}
        onRefresh={_onRefresh}
        renderItem={_renderItem}
        placeholder={<NotesPlaceHolder colors={colors} />}
        placeholderText={`Add some notes to this" ${
          params.type ? params.type : 'topic.'
        }`}
      />
    </Container>
  );
};

Notes.navigationOptions = {
  header: null,
};

export default Notes;
