import React, {useEffect, useState} from 'react';
import {FlatList, Text, View, Platform} from 'react-native';
import {db} from '../../../App';
import Container from '../../components/Container';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider/actions';

export const Notes = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, currentEditingNote} = state;
  const allNotes = state.notes;
  const [notes, setNotes] = useState([]);

  let params = navigation.state ? navigation.state.params : null;

  useEffect(() => {
    if (!params) {
      params = {
        title: 'Notes',
      };
    }
  }, []);

  useEffect(() => {
    if (params.type === 'tag') {
      let notesInTag = db.getTag(params.tag.title);
      setNotes([...notesInTag]);
    } else {
      let allNotes = db.getTopic(params.notebookID, params.title);
      if (allNotes && allNotes.length > 0) {
        setNotes(allNotes);
      }
    }
  }, [allNotes]);

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
        onLongPress={() => {
          dispatch({type: ACTIONS.SELECTION_MODE, enabled: !selectionMode});
          dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
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

  const _listKeyExtractor = (item, index) => item.dateCreated.toString();

  return (
    <Container
      bottomButtonText="Create a new note"
      canGoBack={false}
      heading={params.title}
      canGoBack={true}
      data={notes}
      placeholder={`Search in ${params.title}`}
      bottomButtonOnPress={() => {}}>
      <FlatList
        data={notes}
        keyExtractor={_listKeyExtractor}
        ListFooterComponent={_ListFooterComponent}
        onScroll={_onScroll}
        ListHeaderComponent={_ListHeaderComponent_S}
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
