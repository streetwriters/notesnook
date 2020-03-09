import React, {useEffect, useState} from 'react';
import {useIsFocused} from 'react-navigation-hooks';
import Container from '../../components/Container';
import {FavoritesPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {ToastEvent, w} from '../../utils/utils';
import SimpleList from '../../components/SimpleList';

export const Favorites = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, favorites} = state;
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      dispatch({
        type: ACTIONS.CURRENT_SCREEN,
        screen: 'favorites',
      });
      dispatch({type: ACTIONS.FAVORITES});
    }
  }, [isFocused]);

  const _onRefresh = async () => {
    setRefreshing(true);
    try {
      await db.sync();

      dispatch({type: ACTIONS.FAVORITES});
      dispatch({type: ACTIONS.USER});
      setRefreshing(false);
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      setRefreshing(false);
      ToastEvent.show('Sync failed, network error', 'error');
    }
  };

  const _renderItem = ({item, index}) => (
    <SelectionWrapper item={item}>
      {item.type === 'note' ? (
        <NoteItem
          customStyle={{
            width: selectionMode ? w - 74 : '100%',
            marginHorizontal: 0,
          }}
          colors={colors}
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
          item={item}
          index={index}
          isTrash={false}
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
          isTrash={false}
          index={index}
        />
      )}
    </SelectionWrapper>
  );

  return (
    <Container
      menu={true}
      heading="Favorites"
      placeholder="Search your notes"
      canGoBack={false}
      customIcon="menu"
      data={favorites}
      type="notes"
      noBottomButton={true}>
      <SimpleList
        data={favorites}
        type="notes"
        refreshing={refreshing}
        focused={isFocused}
        onRefresh={_onRefresh}
        renderItem={_renderItem}
        placeholder={<FavoritesPlaceHolder />}
        placeholderText="Notes you favorite appear here"
      />
    </Container>
  );
};

Favorites.navigationOptions = {
  header: null,
};

export default Favorites;
