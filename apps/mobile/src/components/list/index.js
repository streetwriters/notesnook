import React, { useEffect, useRef, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { FastList } from 'superlist';
import { notesnook } from '../../../e2e/test.ids';
import { eSendEvent } from '../../services/event-manager';
import Sync from '../../services/sync';
import { useSettingStore } from '../../stores/use-setting-store';
import { useThemeStore } from '../../stores/use-theme-store';
import { db } from '../../utils/database';
import { eScrollEvent } from '../../utils/events';
import { tabBarRef } from '../../utils/global-refs';
import JumpToSectionDialog from '../dialogs/jump-to-section';
import { Footer } from '../list-items/footer';
import { Header } from '../list-items/headers/header';
import { SectionHeader } from '../list-items/headers/section-header';
import { NoteWrapper } from '../list-items/note/wrapper';
import { NotebookWrapper } from '../list-items/notebook/wrapper';
import TagItem from '../list-items/tag';
import { Empty } from './empty';

const renderItems = {
  note: NoteWrapper,
  notebook: NotebookWrapper,
  topic: NotebookWrapper,
  tag: TagItem,
  section: SectionHeader,
  header: SectionHeader
};

const itemHeights = {
  notes: 70,
  notebooks: 100,
  topics: 80,
  tags: 80,
  sections: 40,
  headers: 40
};

const RenderItem = ({ item, index, type, ...restArgs }) => {
  if (!item) return <View />;
  const Item = renderItems[item.itemType || item.type] || View;
  const groupOptions = db.settings?.getGroupOptions(type);
  const dateBy = groupOptions.sortBy !== 'title' ? groupOptions.sortBy : 'dateEdited';

  let tags =
    item.tags
      ?.slice(0, 3)
      ?.map(item => {
        let tag = db.tags.tag(item);

        if (!tag) return null;
        return {
          title: tag.title,
          id: tag.id,
          alias: tag.alias
        };
      })
      .filter(t => t !== null) || [];
  return <Item item={item} tags={tags} dateBy={dateBy} index={index} type={type} {...restArgs} />;
};

const List = ({
  listData,
  type,
  refreshCallback,
  placeholderData,
  loading,
  headerProps = {
    heading: 'Home',
    color: null
  },
  screen,
  ListHeader,
  warning
}) => {
  const colors = useThemeStore(state => state.colors);
  const scrollRef = useRef();
  const [_loading, _setLoading] = useState(false);

  const compactMode =
    type !== 'notes' && type !== 'notebooks'
      ? null
      : useSettingStore(
          state => state.settings[type === 'notes' ? 'notesListMode' : 'notebooksListMode']
        );

  const heights = listData.map(item => {
    let height = itemHeights[item.type + 's'];
    return item.type !== 'header' ? (compactMode === 'compact' ? 50 : height) : height;
  });

  // useEffect(() => {
  //   let timeout = null;
  //   if (!loading) {
  //     timeout = setTimeout(
  //       () => {
  //         _setLoading(false);
  //       },
  //       listData.length === 0 ? 0 : 300
  //     );
  //   } else {
  //     _setLoading(true);
  //   }
  //   return () => {
  //    // clearTimeout(timeout);
  //   };
  // }, [loading]);

  const renderRow = React.useCallback(
    (section, row) => {
      return (
        <RenderItem
          item={listData[row]}
          index={row}
          color={headerProps.color}
          title={headerProps.heading}
          type={screen === 'Notes' ? 'home' : type}
          screen={screen}
        />
      );
    },
    [headerProps.color, headerProps.heading, listData]
  );

  const _onRefresh = async () => {
    await Sync.run();
    if (refreshCallback) {
      refreshCallback();
    }
  };

  const _onScroll = React.useCallback(
    event => {
      if (!event) return;
      let y = event.nativeEvent.contentOffset.y;
      eSendEvent(eScrollEvent, {
        y,
        screen
      });
    },
    [screen]
  );

  let styles = {
    width: '100%',
    minHeight: 1,
    minWidth: 1,
    backgroundColor: colors.bg
  };

  //const _keyExtractor = item => item.id || item.title;

  const renderEmpty = React.useCallback(() => {
    return (
      <Empty
        loading={loading || _loading}
        placeholderData={placeholderData}
        headerProps={headerProps}
        type={type}
        screen={screen}
      />
    );
  }, [loading, _loading]);

  const renderFooter = React.useCallback(() => {
    return <Footer />;
  }, []);

  const renderHeader = React.useCallback(() => {
    return (
      <>
        {ListHeader ? (
          ListHeader
        ) : (
          <Header
            title={headerProps.heading}
            color={headerProps.color}
            type={type}
            screen={screen}
            warning={warning}
          />
        )}
      </>
    );
  }, [headerProps.heading, headerProps.color]);

  const rowHeight = React.useCallback((section, row) => heights[row], [listData.length]);

  return (
    <>
      <FastList
        style={styles}
        ref={scrollRef}
        testID={notesnook.list.id}
        sections={[listData.length]}
        batchSize={height => height / 2.2}
        renderAheadMultiplier={2}
        renderBehindMultiplier={1}
        rowHeight={rowHeight}
        renderRow={renderRow}
        onScroll={_onScroll}
        onMomentumScrollEnd={() => {
          tabBarRef.current?.unlock();
        }}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.nav}
            onRefresh={_onRefresh}
            refreshing={false}
          />
        }
        renderEmpty={renderEmpty}
        renderFooter={renderFooter}
        renderHeader={renderHeader}
      />
      <JumpToSectionDialog
        screen={screen}
        data={listData}
        type={screen === 'Notes' ? 'home' : type}
        scrollRef={scrollRef}
      />
    </>
  );
};

export default List;
