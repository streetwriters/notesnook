import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';
import {ToastEvent, hexToRGBA} from '../../utils/utils';
import {NotesPlaceHolder} from '../ListPlaceholders';
import NoteItem from '../NoteItem';
import SelectionWrapper from '../SelectionWrapper';
import {db, DDS} from '../../../App';

export const NotesList = ({isGrouped = false}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, currentEditingNote, loading, keyword} = state;
  const notes = [...state.notes];
  const searchResults = [...state.searchResults];
  const [refreshing, setRefreshing] = useState(false);

  const _renderItem = ({item, index}) => (
    <SelectionWrapper
      index={index}
      currentEditingNote={
        currentEditingNote === item.id ? currentEditingNote : null
      }
      item={item}>
      <NoteItem
        colors={colors}
        customStyle={{
          width: selectionMode ? '90%' : '100%',
          marginHorizontal: 0,
        }}
        currentEditingNote={
          currentEditingNote === item.id ? currentEditingNote : null
        }
        onLongPress={() => {
          dispatch({type: ACTIONS.SELECTION_MODE, enabled: !selectionMode});
          dispatch({type: ACTIONS.SELECTED_ITEMS, item: item});
        }}
        update={() => {
          dispatch({type: ACTIONS.NOTES});
        }}
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

  const _ListHeaderComponent = (
    <View
      style={{
        marginTop:
          Platform.OS == 'ios'
            ? notes[0] && !selectionMode
              ? DDS.isTab
                ? 115
                : 135
              : 135 - 60
            : notes[0] && !selectionMode
            ? 155
            : 155 - 60,
      }}>
      <PinnedItems />
    </View>
  );

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
      {loading ? (
        <ActivityIndicator size={SIZE.xl} color={colors.accent} />
      ) : (
        <>
          <NotesPlaceHolder colors={colors} />
          <Text
            style={{
              color: colors.icon,
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              marginTop: 35,
            }}>
            Notes you write will appear here.
          </Text>
        </>
      )}
    </View>
  );

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

  const _ListHeaderComponent_S = (
    <View
      style={{
        marginTop:
          Platform.OS == 'ios'
            ? notes[0]
              ? DDS.isTab
                ? 115
                : 135
              : 135 - 60
            : notes[0]
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
        Search Results for War
      </Text>
      <Text
        onPress={() => {
          dispatch({
            type: ACTIONS.SEARCH_RESULTS,
            results: [],
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
  );

  const _listKeyExtractor = (item, index) => item.id.toString();

  return isGrouped && searchResults.length === 0 ? (
    <SectionList
      ref={ref => (sectionListRef = ref)}
      sections={notes}
      refreshControl={
        <RefreshControl
          tintColor={colors.accent}
          colors={[colors.accent]}
          progressViewOffset={165}
          onRefresh={async () => {
            setRefreshing(true);
            try {
              await db.sync();
              dispatch({type: ACTIONS.NOTES});
              dispatch({type: ACTIONS.PINNED});
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
      keyExtractor={_listKeyExtractor}
      renderSectionHeader={_renderSectionHeader}
      onScroll={_onScroll}
      ListEmptyComponent={_ListEmptyComponent}
      ListHeaderComponent={_ListHeaderComponent}
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
      renderItem={_renderItem}
    />
  ) : (
    <FlatList
      data={searchResults}
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
  );
};

const PinnedItems = () => {
  const [state, dispatch] = useTracked();
  const {pinned, colors} = state;

  useEffect(() => {
    dispatch({type: ACTIONS.PINNED});
  }, []);

  return (
    <>
      <FlatList
        data={pinned}
        keyExtractor={(item, index) => item.id.toString()}
        renderItem={({item, index}) =>
          item.type === 'note' ? (
            <NoteItem
              colors={colors}
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
              pinned={true}
              item={item}
              index={index}
            />
          ) : null
        }
      />
    </>
  );
};
