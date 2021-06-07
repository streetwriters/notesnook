import React, { useEffect, useRef, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useTracked } from '../../provider';
import {
  eSendEvent
} from '../../services/EventManager';
import SettingsService from '../../services/SettingsService';
import Sync from '../../services/Sync';
import { COLORS_NOTE } from '../../utils/Colors';
import { eScrollEvent } from '../../utils/Events';
import useAnnouncement from '../../utils/useAnnouncement';
import JumpToDialog from '../JumpToDialog';
import { NotebookItem } from '../NotebookItem';
import { NotebookWrapper } from '../NotebookItem/wrapper';
import NoteItem from '../NoteItem';
import { NoteWrapper } from '../NoteItem/wrapper';
import TagItem from '../TagItem';
import { Announcement } from './announcement';
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

const TrashI = ({item, index}) => {
  return item.itemType === 'note' ? (
    <NoteItem item={item} index={index} />
  ) : (
    <NotebookItem item={item} index={index} />
  );
};

let renderItems = {
  notes: NoteWrapper,
  notebooks: NotebookWrapper,
  topics:NotebookWrapper,
  tags: TagItem,
  section: SectionHeader,
  trash: TrashI,
};

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
  const [announcement, remove] = useAnnouncement();
  const [_loading, _setLoading] = useState(true);
  const RenderItem = renderItems[type];
  const refreshing = false;

  useEffect(() => {
    if (!_loading) {
      setDataProvider(listData);
    }
  }, [listData]);

  useEffect(() => {
    if (!loading) {
      setDataProvider(
        listData.length > 1 && SettingsService.get().homepage !== screen
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
  }, [loading]);

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
          />
        }
        ListFooterComponent={<Footer />}
        ListHeaderComponent={
          announcement ? (
            <Announcement
              announcement={announcement}
              remove={remove}
              color={
                COLORS_NOTE[headerProps.heading?.toLowerCase()] || colors.accent
              }
            />
          ) : (
            <Header
              title={headerProps.heading}
              paragraph={headerProps.paragraph}
              onPress={headerProps.onPress}
              icon={headerProps.icon}
              type={type}
              announcement={announcement}
              screen={screen}
            />
          )
        }
      />

      <JumpToDialog scrollRef={scrollRef} />
    </>
  );
};

export default SimpleList;
