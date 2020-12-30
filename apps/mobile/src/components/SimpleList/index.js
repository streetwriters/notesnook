import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  View,
} from 'react-native';
import {TouchableWithoutFeedback} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {DataProvider, LayoutProvider, RecyclerListView} from 'recyclerlistview';
import {useTracked} from '../../provider';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import Sync from '../../services/Sync';
import {dHeight} from '../../utils';
import {COLORS_NOTE} from '../../utils/Colors';
import {eOpenJumpToDialog, eScrollEvent} from '../../utils/Events';
import {SIZE} from '../../utils/SizeUtils';
import {Button} from '../Button';
import {HeaderMenu} from '../Header/HeaderMenu';
import Seperator from '../Seperator';
import TagItem from '../TagItem';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';
import {ListHeaderComponent} from './ListHeaderComponent';
import {NotebookItemWrapper} from './NotebookItemWrapper';
import {NoteItemWrapper} from './NoteItemWrapper';

const header = {
  type: 'MAIN_HEADER',
};

const SimpleList = ({
  data,
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
  const [state, dispatch] = useTracked();
  const {colors, searchResults, headerTextState} = state;
  const [refreshing, setRefreshing] = useState(false);

  const [dataProvider, setDataProvider] = useState(
    new DataProvider((r1, r2) => {
      return r1 !== r2;
    }).cloneWithRows([header, {type: 'empty'}]),
  );
  const insets = useSafeAreaInsets();

  const {width, fontScale, height} = useWindowDimensions();

  const listData = data;
  const dataType = type;
  const _onScroll = (event) => {
    if (!event) return;
    let y = event.nativeEvent.contentOffset.y;
    eSendEvent(eScrollEvent, y);
  };

  useEffect(() => {
    loadData();
  }, [data, searchResults.results,loading]);

  const loadData = () => {
    if (loading) return;
    let mainData = [header, {type: 'empty'}];
    mainData =
      !listData || listData.length === 0 ? mainData : [header, ...listData];
    setDataProvider(dataProvider.cloneWithRows(mainData));
  };

  const RenderSectionHeader = ({item, index}) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: 35,
        backgroundColor:
          index === 1
            ? headerProps.color
              ? colors[headerProps.color]
              : colors.shade
            : colors.nav,
        marginTop: index === 1 ? 0 : 5,
      }}>
      <TouchableWithoutFeedback
        onPress={() => {
          if (jumpToDialog) {
            eSendEvent(eOpenJumpToDialog);
          }
        }}
        hitSlop={{top: 10, left: 10, right: 30, bottom: 15}}
        style={{
          height: '100%',
          justifyContent: 'center',
        }}>
        <Heading
          color={colors.accent}
          size={SIZE.sm}
          style={{
            minWidth: 60,
            alignSelf: 'center',
            textAlignVertical: 'center',
          }}>
          {!item.title || item.title === '' ? 'Pinned' : item.title}
        </Heading>
      </TouchableWithoutFeedback>
      {index === 1 && sortMenuButton ? <HeaderMenu /> : null}
    </View>
  );

  const _onRefresh = async () => {
    await Sync.run();
    if (refreshCallback) {
      refreshCallback();
    }
  };

  const _ListEmptyComponent = (
    <View
      style={[
        {
          backgroundColor: colors.bg,
          height: height - 250 - insets.top,
          width: '100%',
        },
      ]}>
      <View
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Heading>{placeholderData.heading}</Heading>
        <Paragraph
          style={{
            textAlign: 'center',
            width: '80%',
          }}
          color={colors.icon}>
          {loading ? placeholderData.loading : placeholderData.paragraph}
        </Paragraph>
        <Seperator />
        {placeholderData.button && !loading ? (
          <Button
            onPress={placeholderData.action}
            title={placeholderData.button}
            icon="plus"
            type="accent"
            fontSize={SIZE.md}
            accentColor="bg"
            accentText={
              COLORS_NOTE[headerTextState.heading.toLowerCase()]
                ? headerTextState.heading.toLowerCase()
                : 'accent'
            }
          />
        ) : loading ? (
          <ActivityIndicator color={colors.accent} />
        ) : null}
      </View>
    </View>
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
        return (
          <NoteItemWrapper item={data} pinned={data.pinned} index={index} />
        );
      case 'notebook':
        return (
          <NotebookItemWrapper item={data} pinned={data.pinned} index={index} />
        );
      case 'tag':
        return <TagItem item={data} index={index} />;
      case 'topic':
        return (
          <NotebookItemWrapper
            item={data}
            isTopic={true}
            pinned={data.pinned}
            index={index}
          />
        );
      case 'trash':
        return data.itemType === 'note' ? (
          <NoteItemWrapper item={data} index={index} isTrash={true} />
        ) : (
          <NotebookItemWrapper item={data} index={index} isTrash={true} />
        );
      case 'MAIN_HEADER':
        return (
          <ListHeaderComponent
            title={headerProps.heading}
            type={dataType}
            index={index}
            data={listData}
          />
        );
      case 'header':
        return <RenderSectionHeader item={data} index={index} />;
      case 'empty':
        return _ListEmptyComponent;
    }
  };

  return (
    <RecyclerListView
      ref={scrollRef}
      layoutProvider={_layoutProvider}
      dataProvider={dataProvider}
      rowRenderer={_renderRow}
      onScroll={_onScroll}
      canChangeSize={true}
      optimizeForInsertDeleteAnimations
      forceNonDeterministicRendering
      renderFooter={() => <View style={{height: 300}} />}
      scrollViewProps={{
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
      }}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
        width: '100%',
      }}
    />
  );
};

export default SimpleList;
