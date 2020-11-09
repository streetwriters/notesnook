import React, {useCallback, useEffect, useState} from 'react';
import {
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {DataProvider, LayoutProvider, RecyclerListView} from 'recyclerlistview';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {
  eOpenJumpToDialog,
  eOpenLoginDialog,
  eScrollEvent,
} from '../../utils/Events';
import {PressableButton} from '../PressableButton';
import {COLORS_NOTE} from '../../utils/Colors';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {db} from '../../utils/DB';
import {HeaderMenu} from '../Header/HeaderMenu';

const header = {
  type: 'MAIN_HEADER',
};

const SimpleList = ({
  data,
  type,
  placeholder,
  RenderItem,
  customRefresh,
  customRefreshing,
  refreshCallback,
  sortMenuButton,
  scrollRef,
  jumpToDialog,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, messageBoardState} = state;
  const searchResults = {...state.searchResults};
  const [refreshing, setRefreshing] = useState(false);
  const [dataProvider, setDataProvider] = useState(
    new DataProvider((r1, r2) => {
      return r1 !== r2;
    }),
  );
  const {width, fontScale} = useWindowDimensions();

  const listData = data;
  const dataType = type;
  const _onScroll = (event) => {
    console.log(event.nativeEvent);
    if (!event) return;
    let y = event.nativeEvent.contentOffset.y;
    eSendEvent(eScrollEvent, y);
  };

  useEffect(() => {
    loadData();
  }, [listData, searchResults.results]);

  const loadData = () => {
    let mainData = [header, ...listData];
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
        height: 30,
      }}>
      <Text
        onPress={() => {
          console.log('clicekd');
          if (jumpToDialog) {
            eSendEvent(eOpenJumpToDialog);
          }
        }}
        style={[
          styles.sectionHeader,
          {
            color: colors.accent,
            height: 30,
            minWidth: 60,
            textAlignVertical: 'bottom',
          },
        ]}>
        {item.title}
      </Text>
      {index === 1 && sortMenuButton ? <HeaderMenu /> : null}
    </View>
  );

  const _onRefresh = useCallback(async () => {
    if (Platform.OS === 'ios') {
      dispatch({
        type: Actions.SYNCING,
        syncing: true,
      });
    } else {
      setRefreshing(true);
    }
    try {
      let user = await db.user.get();
      dispatch({type: Actions.USER, user: user});
      await db.sync();
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      ToastEvent.show(
        'You must login to sync.',
        'error',
        'global',
        5000,
        () => {
          eSendEvent(eOpenLoginDialog);
        },
        'Login',
      );
    } finally {
      if (Platform.OS === 'ios') {
        dispatch({
          type: Actions.SYNCING,
          syncing: false,
        });
      } else {
        setRefreshing(false);
      }
      if (refreshCallback) {
        refreshCallback();
      }
    }
    dispatch({type: Actions.ALL});
  }, []);

  const _ListEmptyComponent = (
    <View
      style={[
        {
          backgroundColor: colors.bg,
        },
        styles.emptyList,
      ]}>
      <>{placeholder}</>
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
          dim.height = 30 * fontScale;
          break;
        case 'MAIN_HEADER':
          dim.width = width;
          dim.height =
            !messageBoardState.visible || !listData[0] || selectionMode
              ? 0
              : 40 * fontScale;
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
        return <RenderItem item={data} pinned={data.pinned} index={index} />;
      case 'notebook':
        return <RenderItem item={data} pinned={data.pinned} index={index} />;
      case 'MAIN_HEADER':
        return (
          <ListHeaderComponent type={dataType} index={index} data={listData} />
        );
      case 'header':
        return <RenderSectionHeader item={data} index={index} />;
      default:
        return <RenderItem item={data} index={index} />;
    }
  };

  return !listData || listData.length === 0 || !dataProvider ? (
    _ListEmptyComponent
  ) : (
    <RecyclerListView
      ref={scrollRef}
      layoutProvider={_layoutProvider}
      dataProvider={dataProvider}
      rowRenderer={_renderRow}
      onScroll={_onScroll}
      renderFooter={() => <View style={{height: 400}} />}
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
      }}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
        width: '100%',
        paddingTop: 10,
      }}
    />
  );
};

export default SimpleList;

const MessageCard = ({data}) => {
  const [state] = useTracked();
  const {colors, selectionMode, currentScreen, messageBoardState} = state;

  return (
    <View>
      {!messageBoardState.visible || !data[0] || selectionMode ? null : (
        <PressableButton
          onPress={messageBoardState.onPress}
          color={
            COLORS_NOTE[currentScreen]
              ? COLORS_NOTE[currentScreen]
              : colors.shade
          }
          selectedColor={
            COLORS_NOTE[currentScreen]
              ? COLORS_NOTE[currentScreen]
              : colors.accent
          }
          alpha={!colors.night ? -0.02 : 0.1}
          opacity={0.12}
          customStyle={styles.loginCard}>
          <View
            style={{
              width: 25,
              backgroundColor: COLORS_NOTE[currentScreen]
                ? COLORS_NOTE[currentScreen]
                : colors.accent,
              height: 25,
              borderRadius: 100,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Icon
              style={styles.loginIcon}
              name={messageBoardState.icon}
              color="white"
              size={SIZE.xs}
            />
          </View>
          <View
            style={{
              marginLeft: 10,
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                color: colors.icon,
                fontSize: SIZE.xxs - 1,
              }}>
              {messageBoardState.message}
            </Text>
            <Text
              style={{
                color: COLORS_NOTE[currentScreen]
                  ? COLORS_NOTE[currentScreen]
                  : colors.accent,
                fontSize: SIZE.xxs,
              }}>
              {messageBoardState.actionText}
            </Text>
          </View>
        </PressableButton>
      )}
    </View>
  );
};

const ListHeaderComponent = ({type, data}) => {
  return <MessageCard type={type} data={data} />;
};

const styles = StyleSheet.create({
  loginCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    alignSelf: 'center',
    height: 40,
    borderRadius: 0,
    position: 'relative',
  },
  loginIcon: {
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 40,
  },
  sectionHeader: {
    fontFamily: WEIGHT.bold,
    fontSize: SIZE.xs + 1,
    alignSelf: 'center',
    textAlignVertical: 'center',
  },
  emptyList: {
    height: '100%',
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
});
