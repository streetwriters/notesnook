import React, {useEffect} from 'react';
import {FlatList, Platform, SectionList, Text, View} from 'react-native';
import {SIZE, WEIGHT} from '../../common/common';
import {ACTIONS, useTracked} from '../../provider';
import {slideLeft, slideRight} from '../../utils/animations';
import {w} from '../../utils/utils';
import {NotesPlaceHolder} from '../ListPlaceholders';
import NoteItem from '../NoteItem';
import SelectionWrapper from '../SelectionWrapper';
import PullToRefresh from '../PullToRefresh';
let sectionListRef;
export const NotesList = ({
  onScroll,
  isSearch = false,
  isGrouped = false,
  refresh = () => {},
  searchResults,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode} = state;
  const notes = [...state.notes];

  const _renderItem = ({item, index}) => (
    <SelectionWrapper item={item}>
      <NoteItem
        colors={colors}
        customStyle={{
          width: selectionMode ? w - 74 : '100%',
          marginHorizontal: 0,
        }}
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

    y = event.nativeEvent.contentOffset.y;
    onScroll(y);
  };

  const _ListHeaderComponent = (
    <View
      style={{
        marginTop:
          Platform.OS == 'ios'
            ? notes[0] && !selectionMode
              ? 135
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
      <NotesPlaceHolder animation={slideRight} colors={colors} />
      <NotesPlaceHolder animation={slideLeft} colors={colors} />
      <NotesPlaceHolder animation={slideRight} colors={colors} />
      <Text
        style={{
          color: colors.icon,
          fontSize: SIZE.md,
          fontFamily: WEIGHT.regular,
          marginTop: 20,
        }}>
        Notes you write will appear here.
      </Text>
      <Text
        style={{
          fontSize: SIZE.sm,
          color: colors.icon,
          marginTop: 20,
        }}>
        No notes found
      </Text>
    </View>
  );

  const _renderSectionHeader = ({section: {title}}) => (
    <Text
      style={{
        fontFamily: WEIGHT.bold,
        fontSize: SIZE.sm,
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
              ? 135
              : 135 - 60
            : notes[0]
            ? 155
            : 155 - 60,
      }}></View>
  );

  const _listKeyExtractor = (item, index) => item.dateCreated.toString();

  return isGrouped && !isSearch ? (
    <SectionList
      ref={ref => (sectionListRef = ref)}
      sections={notes}
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
        keyExtractor={(item, index) => item.dateCreated.toString()}
        renderItem={({item, index}) =>
          item.type === 'note' ? (
            <NoteItem
              colors={colors}
              customStyle={{
                backgroundColor: colors.shade,
                width: '100%',
                paddingHorizontal: '5%',
                paddingTop: 20,
                marginHorizontal: 0,
                marginBottom: 10,
                paddingHorizontal: 12,
                marginTop: 20,
                borderBottomWidth: 0,
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
