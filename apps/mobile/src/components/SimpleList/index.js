import React, {createRef, useState} from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import {useSafeArea} from 'react-native-safe-area-context';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eClearSearch, eScrollEvent} from '../../services/events';
import {db, hexToRGBA, ToastEvent} from '../../utils/utils';
import {NotebookItem} from '../NotebookItem';
import NoteItem from '../NoteItem';
import SelectionWrapper from '../SelectionWrapper';
const sectionListRef = createRef();
const SimpleList = ({
  data,
  type,
  placeholder,
  renderItem,
  focused,
  placeholderText,
  pinned = null,
  customRefresh,
  customRefreshing,
  isMove,
  hideMore,
  noteToMove,
  isHome = false,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, syncing} = state;
  const searchResults = {...state.searchResults};
  const [refreshing, setRefreshing] = useState(false);
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

  const _renderSectionHeader = ({section: {title}}) => (
    <Text
      style={{
        fontFamily: WEIGHT.bold,
        fontSize: SIZE.xs + 1,
        color: colors.accent,
        paddingHorizontal: 12,
        width: '100%',
        alignSelf: 'center',
        marginTop: 15,
        paddingBottom: 5,
      }}>
      {title}
    </Text>
  );

  const _onRefresh = async () => {
    if (Platform.OS === 'ios') {
      dispatch({
        type: ACTIONS.SYNCING,
        syncing: true,
      });
    } else {
      setRefreshing(true);
    }
    try {
      let user = await db.user.get();
      dispatch({type: ACTIONS.USER, user: user});
      await db.sync();
      if (Platform.OS === 'ios') {
        dispatch({
          type: ACTIONS.SYNCING,
          syncing: false,
        });
      } else {
        setRefreshing(false);
      }
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      if (Platform.OS === 'ios') {
        dispatch({
          type: ACTIONS.SYNCING,
          syncing: false,
        });
      } else {
        setRefreshing(false);
      }
      ToastEvent.show(e.message, 'error');
    }
    dispatch({type: ACTIONS.ALL});
  };

  const _ListHeaderComponent_S =
    searchResults.type === type && searchResults.results.length > 0 ? (
      <View
        style={{
          marginTop:
            Platform.OS == 'ios'
              ? data[0] && !selectionMode
                ? 115
                : 115 - 60
              : data[0] && !selectionMode
              ? 155 - insets.top
              : 155 - insets.top - 60,
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
          Showing Results for {searchResults.keyword}
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
                ? 115
                : 115 - 60
              : data[0] && !selectionMode
              ? 155 - insets.top
              : 155 - 60 - insets.top,
        }}>
        {pinned && pinned.length > 0 ? (
          <>
            <FlatList
              data={pinned}
              keyExtractor={(item, index) => item.id.toString()}
              renderItem={({item, index}) =>
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
                        dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
                      }}
                      noteToMove={noteToMove}
                      item={item}
                      pinned={true}
                      index={index}
                      colors={colors}
                    />
                  </SelectionWrapper>
                ) : (
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
                    <NoteItem
                      colors={colors}
                      customStyle={{
                        width: selectionMode ? '90%' : '100%',
                        marginHorizontal: 0,
                        paddingTop: 15,
                        paddingRight: 18,
                        marginBottom: 10,
                        marginTop: 15,
                        borderBottomWidth: 0,
                      }}
                      currentEditingNote={false}
                      pinned={true}
                      selectionMode={selectionMode}
                      onLongPress={() => {
                        if (!selectionMode) {
                          dispatch({
                            type: ACTIONS.SELECTION_MODE,
                            enabled: true,
                          });
                        }
                        dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
                      }}
                      update={() => {
                        dispatch({type: ACTIONS.NOTES});
                      }}
                      item={item}
                      index={index}
                    />
                  </SelectionWrapper>
                )
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

  return isHome && searchResults.type !== 'notes' ? (
    <SectionList
      ref={sectionListRef}
      sections={data}
      refreshControl={
        <RefreshControl
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressViewOffset={150}
          onRefresh={_onRefresh}
          refreshing={refreshing}
        />
      }
      keyExtractor={_listKeyExtractor}
      renderSectionHeader={_renderSectionHeader}
      onScroll={_onScroll}
      stickySectionHeadersEnabled={false}
      ListEmptyComponent={_ListEmptyComponent}
      ListHeaderComponent={_ListHeaderComponent_S}
      contentContainerStyle={{
        width: '100%',
        alignSelf: 'center',
        minHeight: '100%',
      }}
      style={{
        height: '100%',
      }}
      removeClippedSubviews={true}
      ListFooterComponent={_ListFooterComponent}
      renderItem={renderItem}
    />
  ) : (
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
          progressViewOffset={150}
          onRefresh={customRefresh ? customRefresh : _onRefresh}
          refreshing={customRefresh ? customRefreshing : refreshing}
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
