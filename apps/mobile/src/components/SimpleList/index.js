import React, {useState} from 'react';
import {FlatList, Platform, RefreshControl, Text, View} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import {inputRef} from '../../components/SearchInput';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';

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
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;
  const searchResults = {...state.searchResults};

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
              ? 155
              : 155 - 60,
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
            inputRef.current?.setNativeProps({
              text: '',
            });
            dispatch({
              type: ACTIONS.SEARCH_RESULTS,
              results: {
                results: [],
                type: null,
                keyword: null,
              },
            });
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
              renderItem={({item, index}) =>
                item.type === 'notebook' ? (
                  <NotebookItem
                    hideMore={params.hideMore}
                    customStyle={{
                      backgroundColor: Platform.ios
                        ? hexToRGBA(colors.accent + '19')
                        : hexToRGBA(colors.shade),
                      width: '100%',
                      paddingHorizontal: 12,
                      paddingTop: 20,
                      paddingRight: 18,
                      marginBottom: 10,
                      marginTop: 20,
                      borderBottomWidth: 0,
                      marginHorizontal: 0,
                    }}
                    isMove={params.isMove}
                    onLongPress={() => {}}
                    noteToMove={params.note}
                    item={item}
                    pinned={true}
                    index={index}
                    colors={colors}
                  />
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
        opacity: 0.8,
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
    item.dateCreated.toString() + index.toString();

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
