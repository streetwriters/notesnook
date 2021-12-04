import React, {useEffect, useRef, useState} from 'react';
import {FlatList, RefreshControl} from 'react-native';
import {useTracked} from '../../provider';
import {eSendEvent} from '../../services/EventManager';
import Sync from '../../services/Sync';
import {eScrollEvent} from '../../utils/Events';
import JumpToDialog from '../JumpToDialog';
import {NotebookWrapper} from '../NotebookItem/wrapper';
import {NoteWrapper} from '../NoteItem/wrapper';
import SortDialog from '../SortDialog';
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
  section: SectionHeader
};

const RenderItem = ({item, index}) => {
  if (!item) return <View/>
  const Item = renderItems[item.itemType || item.type] || <View/>

  return (
    <Item item={item} tags={item.tags ? [...item.tags] : []} index={index} />
  );
};

const SimpleList = ({
  listData,
  type,
  customRefresh,
  customRefreshing,
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
  const refreshing = false;

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
    ({item, index}) =>
      item.type === 'header' ? (
        <SectionHeader
          item={item}
          index={index}
          color={headerProps.color}
          title={headerProps.heading}
          type={screen === 'Notes' ? 'home' : type}
        />
      ) : (
        <RenderItem item={item} index={index} />
      ),
    []
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
    height: '100%',
    width: '100%',
    minHeight: 1,
    minWidth: 1,
    backgroundColor:colors.bg
  };

  const _keyExtractor = item => item.id || item.title;

  return (
    <>
      <FlatList
        style={styles}
        keyExtractor={_keyExtractor}
        ref={scrollRef}
        data={_loading ? listData.slice(0, 9) : listData}
        renderItem={renderItem}
        onScroll={_onScroll}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        refreshControl={
          <RefreshControl
            style={{
              opacity: 0,
              elevation: 0
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={150}
            onRefresh={customRefresh ? customRefresh : _onRefresh}
            refreshing={customRefresh ? customRefreshing : refreshing}
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

      <SortDialog
        screen={screen}
        type={screen === 'Notes' ? 'home' : type}
        colors={colors}
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
