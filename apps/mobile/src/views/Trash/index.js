import React, {useState, useEffect} from 'react';
import {Text, FlatList, View} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {NotebookItem} from '../../components/NotebookItem';
import {w} from '../../utils/utils';
import {TrashPlaceHolder} from '../../components/ListPlaceholders';
import Container from '../../components/Container';
import SelectionHeader from '../../components/SelectionHeader';
import {useTracked, ACTIONS} from '../../provider';
import {
  simpleDialogEvent,
  TEMPLATE_EMPTY_TRASH,
} from '../../components/DialogManager';

export const Trash = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, trash} = state;

  useEffect(() => {
    dispatch({
      type: ACTIONS.TRASH,
    });
  });

  const _renderItem = ({item, index}) => (
    <SelectionWrapper item={item}>
      {item.type === 'note' ? (
        <NoteItem
          customStyle={{
            width: selectionMode ? w - 74 : '100%',
            marginHorizontal: 0,
          }}
          onLongPress={() => {
            dispatch({
              type: ACTIONS.SELECTION_MODE,
              enabled: !selectionMode,
            });
            dispatch({
              type: ACTIONS.SELECTED_ITEMS,
              item: item,
            });
          }}
          item={item}
          index={index}
          isTrash={true}
        />
      ) : (
        <NotebookItem
          onLongPress={() => {
            dispatch({
              type: ACTIONS.SELECTION_MODE,
              enabled: !selectionMode,
            });
            dispatch({
              type: ACTIONS.SELECTED_ITEMS,
              item: item,
            });
          }}
          customStyle={{
            width: selectionMode ? w - 74 : '100%',
            marginHorizontal: 0,
          }}
          item={item}
          isTrash={true}
          index={index}
        />
      )}
    </SelectionWrapper>
  );

  _ListEmptyComponent = (
    <View
      style={{
        height: '80%',
        width: '100%',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        opacity: 0.8,
      }}>
      <TrashPlaceHolder colors={colors} />
      <Text
        style={{
          color: colors.icon,
          fontSize: SIZE.md,
          fontFamily: WEIGHT.regular,
          marginTop: 20,
        }}>
        Deleted notes & notebooks appear here.
      </Text>
      <Text
        style={{
          fontSize: SIZE.sm,
          color: colors.icon,
          marginTop: 20,
        }}>
        Trash is empty
      </Text>
    </View>
  );

  return (
    <Container
      bottomButtonOnPress={() => {
        simpleDialogEvent(TEMPLATE_EMPTY_TRASH);
      }}
      bottomButtonText="Clear all trash">
      <SelectionHeader />
      {selectionMode ? null : (
        <Header colors={colors} heading="Trash" canGoBack={false} menu={true} />
      )}

      <FlatList
        keyExtractor={item => item.dateCreated.toString()}
        style={{
          width: '100%',
          alignSelf: 'center',
          height: '100%',
        }}
        contentContainerStyle={{
          height: '100%',
        }}
        data={trash}
        ListEmptyComponent={_ListEmptyComponent}
        renderItem={_renderItem}
      />
    </Container>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
