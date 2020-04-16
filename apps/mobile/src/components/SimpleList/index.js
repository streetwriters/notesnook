import React from 'react';
import { FlatList, Platform, RefreshControl, Text, View } from 'react-native';
import { SIZE, WEIGHT } from '../../common/common';
import { useTracked } from '../../provider';
import { ACTIONS } from '../../provider/actions';
import { eSendEvent } from '../../services/eventManager';
import { eClearSearch, eScrollEvent } from '../../services/events';
import { hexToRGBA } from '../../utils/utils';
import { NotebookItem } from '../NotebookItem';
import SelectionWrapper from '../SelectionWrapper';
import { useSafeArea } from 'react-native-safe-area-context';

const SimpleList = ({
  data,
  type,
  placeholder,
  onRefresh,
  renderItem,
  focused,
  refreshing,
  placeholderText,
  pinned = null,
  isMove,
  hideMore,
  noteToMove,
}) => {
  const [state, dispatch] = useTracked();
  const { colors, selectionMode } = state;
  const searchResults = { ...state.searchResults };
  const insets = useSafeArea();
  const _onScroll = event => {
    if (!event) return;
    let y = event.nativeEvent.contentOffset.y;

    eSendEvent(eScrollEvent, y);
  };

  const _ListFooterComponent = data[0] ? (
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

  const _ListHeaderComponent_S =
    searchResults.type === type && searchResults.results.length > 0 ? (
      <View
        style={{
          marginTop:
            Platform.OS == 'ios'
              ? data[0] && !selectionMode
                ? 135
                : 135 - 60
              : data[0] && !selectionMode
                ? 155 - insets.top
                : (155 - insets.top) - 60,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
        }}>
        <Text
          style={{
            fontFamily: WEIGHT.bold,
            color: colors.accent,
            fontSize: SIZE.xs,
          }}>
          Search Results for {searchResults.keyword}
        </Text>
        <Text
          onPress={() => {
            eSendEvent(eClearSearch);
          }}
          style={{
            fontFamily: WEIGHT.regular,
            color: colors.errorText,
            fontSize: SIZE.xs,
          }}>
          Clear
        </Text>
      </View>
    ) : (
        <View
          style={{
            marginTop:
              Platform.OS == 'ios'
                ? data[0] && !selectionMode
                  ? 135
                  : 135 - 60
                : data[0] && !selectionMode
                  ? 155
                  : 155 - 60,
          }}>
          {pinned && pinned.notebooks && pinned.notebooks.length > 0 ? (
            <>
              <FlatList
                data={pinned.notebooks}
                keyExtractor={(item, index) => item.id.toString()}
                renderItem={({ item, index }) =>
                  item.type === 'notebook' ? (
                    <SelectionWrapper
                      index={index}
                      currentEditingNote={false}
                      pinned={true}
                      background={
                        Platform.ios
                          ? hexToRGBA(colors.accent + '19')
                          : hexToRGBA(colors.shade)
                      }
                      item={item}>
                      <NotebookItem
                        hideMore={hideMore}
                        customStyle={{
                          width: '100%',
                          paddingTop: 15,
                          paddingRight: 18,
                          marginBottom: 10,
                          marginTop: 15,
                          borderBottomWidth: 0,
                          marginHorizontal: 0,
                        }}
                        isMove={isMove}
                        selectionMode={selectionMode}
                        onLongPress={() => {
                          if (!selectionMode) {
                            dispatch({
                              type: ACTIONS.SELECTION_MODE,
                              enabled: true,
                            });
                          }
                          dispatch({ type: ACTIONS.SELECTED_ITEMS, item: item });
                        }}
                        noteToMove={noteToMove}
                        item={item}
                        pinned={true}
                        index={index}
                        colors={colors}
                      />
                    </SelectionWrapper>
                  ) : null
                }
              />
            </>
          ) : null}
        </View>
      );

  const _ListEmptyComponent = (
    <View
      style={{
        height: '80%',
        width: '100%',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        opacity: 1,
      }}>
      <>
        {placeholder}
        <Text
          style={{
            color: colors.icon,
            fontSize: SIZE.sm,
            fontFamily: WEIGHT.regular,
            marginTop: 35,
          }}>
          {placeholderText}
        </Text>
      </>
    </View>
  );

  const _listKeyExtractor = (item, index) =>
    item.id.toString() + index.toString();

  return (
    <FlatList
      data={
        searchResults.type === type &&
          focused &&
          searchResults.results.length > 0
          ? searchResults.results
          : data
      }
      refreshControl={
        <RefreshControl
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressViewOffset={165}
          onRefresh={onRefresh}
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
      renderItem={renderItem}
    />
  );
};

export default SimpleList;
