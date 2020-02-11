import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View, RefreshControl} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {FavoritesPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import NoteItem from '../../components/NoteItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';
import {ToastEvent} from '../../utils/utils';

export const Favorites = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, favorites} = state;
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    dispatch({type: ACTIONS.FAVORITES});
  }, []);

  const onScroll = event => {
    let y = event.nativeEvent.contentOffset.y;
    eSendEvent(eScrollEvent, y);
  };

  return (
    <Container
      menu={true}
      heading="Favorites"
      placeholder="Search your notes"
      canGoBack={false}
      customIcon="menu"
      data={favorites}
      noBottomButton={true}>
      <FlatList
        keyExtractor={item => item.dateCreated.toString()}
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={165}
            onRefresh={async () => {
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
            }}
            refreshing={refreshing}
          />
        }
        style={{
          width: '100%',
          alignSelf: 'center',
          height: '100%',
        }}
        contentContainerStyle={{
          height: '100%',
        }}
        ListHeaderComponent={
          <View
            style={{
              marginTop:
                Platform.OS == 'ios'
                  ? favorites[0]
                    ? 135
                    : 135 - 60
                  : favorites[0]
                  ? 155
                  : 155 - 60,
            }}></View>
        }
        ListEmptyComponent={
          <View
            style={{
              height: '80%',
              width: '100%',
              alignItems: 'center',
              alignSelf: 'center',
              justifyContent: 'center',
              opacity: 0.8,
            }}>
            <FavoritesPlaceHolder />
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
                marginTop: 30,
              }}>
              Favorite notes & notebooks appear here.
            </Text>
          </View>
        }
        data={favorites}
        onScroll={onScroll}
        renderItem={({item, index}) => (
          <SelectionWrapper item={item}>
            {item.type === 'note' ? (
              <NoteItem
                customStyle={{
                  width: selectionMode ? w - 74 : '100%',
                  marginHorizontal: 0,
                }}
                colors={colors}
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
                isTrash={false}
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
                isTrash={false}
                index={index}
              />
            )}
          </SelectionWrapper>
        )}
      />
    </Container>
  );
};

Favorites.navigationOptions = {
  header: null,
};

export default Favorites;
