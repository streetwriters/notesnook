import React, { useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useTracked } from '../../provider';
import { eSendEvent } from '../../services/EventManager';
import SettingsService from '../../services/SettingsService';
import Sync from '../../services/Sync';
import { eScrollEvent } from '../../utils/Events';
import JumpToDialog from '../JumpToDialog';
import { NotebookWrapper } from '../NotebookItem/wrapper';
import { NoteWrapper } from '../NoteItem/wrapper';
import TagItem from '../TagItem';
import { Empty } from './empty';
import { Footer } from './footer';
import { Header } from './header';
import { SectionHeader } from './section-header';

const heights = {
  note: 100,
  notebook: 110,
  tag: 80,
  topic: 80,
  header: 35,
};

let renderItems = {
  note: NoteWrapper,
  notebook: NotebookWrapper,
  topic: NotebookWrapper,
  tag: TagItem,
  section: SectionHeader,
};

const RenderItem = ({item,index}) => {
  const Item = renderItems[item.itemType || item.type]

  return <Item item={item} index={index} />
}

const SimpleList = ({
  listData,
  type,
  customRefresh,
  customRefreshing,
  refreshCallback,
  sortMenuButton,
  jumpToDialog,
  placeholderData,
  loading,
  headerProps = {
    heading: 'Home',
  },
  screen,
}) => {
  const [state] = useTracked();
  const {colors} = state;

  const [dataProvider, setDataProvider] = useState([]);
  const scrollRef = useRef();
  const [_loading, _setLoading] = useState(true);
  const refreshing = false;

  useEffect(() => {
    if (!loading) {
      setDataProvider(
        dataProvider.length < 2 &&
          listData.length >= 1 &&
          SettingsService.get().homepage !== screen
          ? listData.slice(0, 1)
          : listData,
      );

      if (
        !listData ||
        listData.length === 0 ||
        SettingsService.get().homepage === screen
      ) {
        setTimeout(() => {
          _setLoading(false);
        }, 1);
        return;
      }
      setTimeout(() => {
        setDataProvider(listData);
        _setLoading(false);
      }, 150);
    } else {
      setDataProvider([]);
    }
  }, [loading, listData]);

  const renderItem = React.useCallback(
    ({item, index}) =>
      item.type === 'header' ? (
        <SectionHeader
          item={item}
          index={index}
          headerProps={headerProps}
          jumpToDialog={jumpToDialog}
          sortMenuButton={sortMenuButton}
        />
      ) : (
        <RenderItem item={item} index={index} />
      ),
    [],
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
        screen,
      });
    },
    [screen],
  );

  let styles = {
    height: '100%',
    backgroundColor: colors.bg,
    width: '100%',
    minHeight: 1,
    minWidth: 1,
  };

  const _keyExtractor = item => item.id || item.title;

  return (
    <>
      <FlatList
        style={styles}
        keyExtractor={_keyExtractor}
        ref={scrollRef}
        data={dataProvider}
        renderItem={renderItem}
        onScroll={_onScroll}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        refreshControl={
          <RefreshControl
            style={{
              opacity: 0,
              elevation: 0,
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
          <Header
            title={headerProps.heading}
            paragraph={headerProps.paragraph}
            onPress={headerProps.onPress}
            icon={headerProps.icon}
            type={type}
            screen={screen}
          />
        }
      />

      <JumpToDialog scrollRef={scrollRef} />
    </>
  );
};

export default SimpleList;
