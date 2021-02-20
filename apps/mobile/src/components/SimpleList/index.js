import React, {useEffect, useState} from 'react';
import {RefreshControl, useWindowDimensions} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DataProvider, LayoutProvider, RecyclerListView} from 'recyclerlistview';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Sync from '../../services/Sync';
import {dHeight} from '../../utils';
import {eScrollEvent} from '../../utils/Events';
import {NotebookWrapper} from '../NotebookItem/wrapper';
import {NoteWrapper} from '../NoteItem/wrapper';
import TagItem from '../TagItem';
import {Empty} from './empty';
import {Footer} from './footer';
import {Header} from './header';
import {SectionHeader} from './section-header';

const header = {
  type: 'MAIN_HEADER',
};
const emptyData = new DataProvider((r1, r2) => {
  return r1 !== r2;
}).cloneWithRows([header, {type: 'empty'}]);

const SimpleList = ({
  listData,
  type,
  customRefresh,
  customRefreshing,
  refreshCallback,
  sortMenuButton,
  scrollRef,
  jumpToDialog,
  placeholderData,
  loading,
  headerProps = {
    heading: 'Home',
  },
}) => {
  const [state] = useTracked();
  const {colors, deviceMode} = state;
  const [_loading, setLoading] = useState(true);
  const [dataProvider, setDataProvider] = useState(
    new DataProvider((r1, r2) => {
      return r1 !== r2;
    }).cloneWithRows(
      !listData || listData.length === 0
        ? [header, {type: 'empty'}]
        : [header].concat(listData),
    ),
  );

  const insets = useSafeAreaInsets();
  const {width, fontScale} = useWindowDimensions();
  const refreshing = false;
  const dataType = type;

  useEffect(() => {
    setDataProvider(
      dataProvider.cloneWithRows(
        !listData || listData.length === 0
          ? [header, {type: 'empty'}]
          : [header].concat(listData),
      ),
    );
    setLoading(false);
  }, [listData, deviceMode]);


  const _onRefresh = async () => {
    await Sync.run();
    if (refreshCallback) {
      refreshCallback();
    }
  };

  const _onScroll = (event) => {
    if (!event) return;
    let y = event.nativeEvent.contentOffset.y;
    eSendEvent(eScrollEvent, y);
  };

  const emptyLayoutProvider = new LayoutProvider(
    (index) => {
      return emptyData.getDataForIndex(index).type;
    },
    (type, dim) => {

      switch (type) {
        case 'empty':
          dim.width = width;
          dim.height = dHeight - 250 - insets.top;
          break;
        case 'MAIN_HEADER':
          dim.width = width;
          dim.height =
            dataType === 'search' ? 0 : DDS.isLargeTablet() ? 50 : 195;
          break;
        default:
          dim.width = width;
          dim.height = 0;
      }
    },
  );

  const _layoutProvider = new LayoutProvider(
    (index) => {
      return dataProvider.getDataForIndex(index).type;
    },
    (type, dim) => {
      switch (type) {
        case 'note':
          dim.width = width;
          dim.height = 100 * fontScale;
          break;
        case 'notebook':
          dim.width = width;
          dim.height = 110 * fontScale;
          break;
        case 'trash':
          dim.width = width;
          dim.height = 110 * fontScale;
          break;
        case 'empty':
          dim.width = width;
          dim.height = dHeight - 250 - insets.top;
          break;
        case 'topic':
          dim.width = width;
          dim.height = 80 * fontScale;
          break;
        case 'tag':
          dim.width = width;
          dim.height = 80 * fontScale;
          break;
        case 'header':
          dim.width = width;
          dim.height = 40 * fontScale;
          break;
        case 'MAIN_HEADER':
          dim.width = width;
          dim.height =
            dataType === 'search' ? 0 : DDS.isLargeTablet() ? 50 : 195;
          break;
        default:
          dim.width = width;
          dim.height = 0;
      }
    },
  );

  const _renderRow = (type, data, index) => {
    switch (type) {
      case 'note':
        return <NoteWrapper item={data} pinned={data.pinned} index={index} />;
      case 'notebook':
        return (
          <NotebookWrapper item={data} pinned={data.pinned} index={index} />
        );
      case 'tag':
        return <TagItem item={data} index={index} />;
      case 'topic':
        return (
          <NotebookWrapper
            item={data}
            isTopic={true}
            pinned={data.pinned}
            index={index}
          />
        );
      case 'trash':
        return data.itemType === 'note' ? (
          <NoteWrapper item={data} index={index} isTrash={true} />
        ) : (
          <NotebookWrapper item={data} index={index} isTrash={true} />
        );
      case 'MAIN_HEADER':
        return (
          <Header
            title={headerProps.heading}
            paragraph={headerProps.paragraph}
            onPress={headerProps.onPress}
            icon={headerProps.icon}
            type={dataType}
            index={index}
            data={listData}
          />
        );
      case 'header':
        return (
          <SectionHeader
            item={data}
            index={index}
            headerProps={headerProps}
            jumpToDialog={jumpToDialog}
            sortMenuButton={sortMenuButton}
          />
        );
      case 'empty':
        return (
          <Empty
            loading={loading || _loading}
            placeholderData={placeholderData}
          />
        );
    }
  };

  let scrollProps = React.useMemo(() => {
    return {
      refreshControl: (
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
      ),

      overScrollMode: 'always',
      contentContainerStyle: {
        width: '100%',
        alignSelf: 'center',
        minHeight: '100%',
      },
      testID: 'list-' + type,
    };
  }, [colors.accent, type, customRefresh]);

  let styles = {
    height: '100%',
    backgroundColor: colors.bg,
    width: '100%',
  };
  return (
    <RecyclerListView
      ref={scrollRef}
      layoutProvider={
        loading || _loading ? emptyLayoutProvider : _layoutProvider
      }
      dataProvider={loading || _loading ? emptyData : dataProvider}
      rowRenderer={_renderRow}
      onScroll={_onScroll}
      canChangeSize={true}
      renderFooter={Footer}
      scrollViewProps={scrollProps}
      style={styles}
    />
  );
};

export default SimpleList;
