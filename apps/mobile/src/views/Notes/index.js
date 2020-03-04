import React, {useEffect, useState} from 'react';
import {
  FlatList,
  Text,
  View,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {db, DDS} from '../../../App';
import Container from '../../components/Container';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider/actions';
import {ToastEvent, editing, SideMenuEvent} from '../../utils/utils';
import {
  eSendEvent,
  eSubscribeEvent,
  eUnSubscribeEvent,
} from '../../services/eventManager';
import {
  eScrollEvent,
  refreshNotesPage,
  eOnLoadNote,
} from '../../services/events';
import {NotesPlaceHolder} from '../../components/ListPlaceholders';
import {useIsFocused} from 'react-navigation-hooks';
import {openEditorAnimation} from '../../utils/animations';

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
    eSendEvent(eScrollEvent, 0);
    if (params.type === 'tag') {
      let notesInTag = db.notes.tagged(params.tag.title);

      setNotes([...notesInTag]);
    } else if (params.type == 'color') {
      let notesInColors = db.notes.colored(params.color.id);

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

  const _onScroll = event => {
    if (!event) return;
    let y = event.nativeEvent.contentOffset.y;

    eSendEvent(eScrollEvent, y);
  };

  const _ListFooterComponent = notes[0] ? (
    <View
      style={{
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: colors.navbg,
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
        }}>
        - End -
      </Text>
    </View>
  ) : null;

  const _ListHeaderComponent_S = (
    <View
      style={{
        marginTop:
          Platform.OS == 'ios'
            ? notes[0]
              ? 135
              : 135 - 60
            : notes[0]
            ? 155
            : 155 - 60,
      }}></View>
  );

  const _ListEmptyComponent = (
    <View
      style={{
        height: '80%',
        width: '100%',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        opacity: 0.8,
      }}>
      <>
        <NotesPlaceHolder colors={colors} />
        <Text
          style={{
            color: colors.icon,
            fontSize: SIZE.sm,
            fontFamily: WEIGHT.regular,
            marginTop: 35,
          }}>
          Add some notes to this {params.type ? params.type : 'topic.'}
        </Text>
      </>
    </View>
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

  const _listKeyExtractor = (item, index) => item.dateCreated.toString();

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
      placeholder={`Search in ${
        params.type == 'tag' ? '#' + params.title : params.title
      }`}
      bottomButtonOnPress={() => {
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
          SideMenuEvent.close();
          SideMenuEvent.disable();
          eSendEvent(eOnLoadNote, {type: 'new'});
          openEditorAnimation();
        }
      }}>
      <FlatList
        data={notes}
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={165}
            onRefresh={_onRefresh}
            refreshing={refreshing}
          />
        }
        keyExtractor={_listKeyExtractor}
        ListFooterComponent={_ListFooterComponent}
        onScroll={_onScroll}
        ListHeaderComponent={_ListHeaderComponent_S}
        ListEmptyComponent={_ListEmptyComponent}
        contentContainerStyle={{
          width: '100%',
          alignSelf: 'center',
          minHeight: '100%',
        }}
        style={{
          height: '100%',
        }}
        renderItem={_renderItem}
      />
    </Container>
  );
};

Notes.navigationOptions = {
  header: null,
};

export default Notes;
