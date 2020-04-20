import React, {useEffect, useState} from 'react';
import {useIsFocused} from 'react-navigation-hooks';
import Container from '../../components/Container';
import {TrashPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {db, ToastEvent, w} from '../../utils/utils';
import {simpleDialogEvent} from '../../components/DialogManager/recievers';
import {TEMPLATE_EMPTY_TRASH} from '../../components/DialogManager/templates';

export const Trash = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;
  const trash = [...trash];
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
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show('Sync failed, network error', 'error');
    }
    dispatch({type: ACTIONS.TRASH});
    dispatch({type: ACTIONS.USER});
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
        //placeholder={<TrashPlaceHolder colors={colors} />}
        placeholderText="Deleted notes & notebooks appear here."
      />
    </Container>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
