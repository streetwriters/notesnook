import React, {useEffect, useState} from 'react';
import {FlatList, Text, View, RefreshControl} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {
  simpleDialogEvent,
  TEMPLATE_EMPTY_TRASH,
} from '../../components/DialogManager';
import {TrashPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import NoteItem from '../../components/NoteItem';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {w, ToastEvent} from '../../utils/utils';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useIsFocused} from 'react-navigation-hooks';
import {inputRef} from '../../components/SearchInput';
import SimpleList from '../../components/SimpleList';

export const Trash = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, trash} = state;
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();
  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.TRASH,
      });

      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'trash',
      });
    }
  }, [isFocused]);

  const _renderItem = ({item, index}) => (
    <SelectionWrapper colors={colors} item={item}>
      {item.type === 'note' ? (
        <NoteItem
          customStyle={{
            width: selectionMode ? w - 74 : '100%',
            marginHorizontal: 0,
          }}
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
          colors={colors}
          item={item}
          index={index}
          isTrash={true}
        />
      ) : (
        <NotebookItem
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

  const _onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.sync();

      dispatch({type: ACTIONS.TRASH});
      dispatch({type: ACTIONS.USER});
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show('Sync failed, network error', 'error');
    }
  };

  return (
    <Container
      bottomButtonOnPress={() => {
        simpleDialogEvent(TEMPLATE_EMPTY_TRASH);
      }}
      placeholder="Search in trash"
      noSearch={false}
      heading="Trash"
      canGoBack={false}
      menu={true}
      type="trash"
      data={trash}
      bottomButtonText="Clear all trash">
      <SimpleList
        data={trash}
        type="trash"
        refreshing={refreshing}
        focused={isFocused}
        onRefresh={_onRefresh}
        renderItem={_renderItem}
        placeholder={<TrashPlaceHolder colors={colors} />}
        placeholderText="Deleted notes & notebooks appear here."
      />
    </Container>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
