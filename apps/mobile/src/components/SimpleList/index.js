import React, {useEffect, useRef, useState} from 'react';
import {
  FlatList,
  RefreshControl,
  RefreshControlComponent,
  View
} from 'react-native';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {useUserStore} from '../../provider/stores';
import {eSendEvent} from '../../services/EventManager';
import Sync from '../../services/Sync';
import {db} from '../../utils/database';
import {eScrollEvent} from '../../utils/Events';
import {sleep} from '../../utils/TimeUtils';
import JumpToDialog from '../JumpToDialog';
import {NotebookWrapper} from '../NotebookItem/wrapper';
import {NoteWrapper} from '../NoteItem/wrapper';
import TagItem from '../TagItem';
import {Empty} from './empty';
import {Footer} from './footer';
import {Header} from './header';
import {SectionHeader} from './section-header';

let renderItems = {
  note: NoteWrapper,
  notebook: NotebookWrapper,
  topic: NotebookWrapper,
  tag: TagItem,
  section: SectionHeader,
  header: SectionHeader
};

const RenderItem = ({item, index, type, ...restArgs}) => {
  if (!item) return <View />;
  const Item = renderItems[item.itemType || item.type] || View;
  const groupOptions = db.settings?.getGroupOptions(type);
  const dateBy =
    groupOptions.sortBy !== 'title' ? groupOptions.sortBy : 'dateEdited';

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
  return (
    <Item
      item={item}
      tags={tags}
      dateBy={dateBy}
      index={index}
      type={type}
      {...restArgs}
    />
  );
};

const SimpleList = ({
  listData,
  type,
  refreshCallback,
  placeholderData,
  loading,
  headerProps = {
    heading: 'Home'
  },
  screen,
  ListHeader
}) => {
  const [state] = useTracked();
  const {colors} = state;
  const scrollRef = useRef();
  const [_loading, _setLoading] = useState(true);
  //const refreshing = false;
  const [refreshing, setRefreshing] = useState(false);
  const syncing = useUserStore(state => state.syncing);

  useEffect(() => {
    let timeout = null;
    if (!loading) {
      timeout = setTimeout(
        () => {
          _setLoading(false);
        },
        listData.length === 0 ? 0 : 300
      );
    } else {
      _setLoading(true);
    }
    return () => {
      clearTimeout(timeout);
    };
  }, [loading]);

  const renderItem = React.useCallback(
    ({item, index}) => (
      <RenderItem
        item={item}
        index={index}
        color={headerProps.color}
        title={headerProps.heading}
        type={screen === 'Notes' ? 'home' : type}
        screen={screen}
      />
    ),
    []
  );

  const _onRefresh = async () => {
    setRefreshing(true);
    await Sync.run();
    setRefreshing(false);
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
    height: '100%',
    width: '100%',
    minHeight: 1,
    minWidth: 1,
    backgroundColor: colors.bg
  };

  const _keyExtractor = item => item.id || item.title;

  return (
    <>
      <FlatList
        style={styles}
        keyExtractor={_keyExtractor}
        ref={scrollRef}
        testID={notesnook.list.id}
        data={_loading ? listData.slice(0, 9) : listData}
        renderItem={renderItem}
        onScroll={_onScroll}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.nav}
            onRefresh={_onRefresh}
            refreshing={refreshing || syncing}
          />
        }
        ListEmptyComponent={
          <Empty
            loading={loading || _loading}
            placeholderData={placeholderData}
            headerProps={headerProps}
            type={type}
            screen={screen}
          />
        }
        ListFooterComponent={<Footer />}
        ListHeaderComponent={
          <>
            {ListHeader ? (
              ListHeader
            ) : (
              <Header
                title={headerProps.heading}
                paragraph={headerProps.paragraph}
                onPress={headerProps.onPress}
                icon={headerProps.icon}
                color={headerProps.color}
                type={type}
                screen={screen}
              />
            )}
          </>
        }
      />
      <JumpToDialog
        screen={screen}
        data={listData}
        type={screen === 'Notes' ? 'home' : type}
        scrollRef={scrollRef}
      />
    </>
  );
};

export default SimpleList;
