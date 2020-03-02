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
          colors={colors}
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
      <TrashPlaceHolder colors={colors} />
      <Text
        style={{
          color: colors.icon,
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
          marginTop: 30,
        }}>
        Deleted notes & notebooks appear here.
      </Text>
    </View>
  );

  return (
    <Container
      bottomButtonOnPress={() => {
        simpleDialogEvent(TEMPLATE_EMPTY_TRASH);
      }}
      noSearch={true}
      heading="Trash"
      canGoBack={false}
      menu={true}
      bottomButtonText="Clear all trash">
      <FlatList
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={165}
            onRefresh={async () => {
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
            }}
            refreshing={refreshing}
          />
        }
        ListHeaderComponent={
          <View
            style={{
              marginTop: Platform.OS == 'ios' ? 135 - 60 : 155 - 60,
            }}
          />
        }
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
