import React, {useEffect, useState} from 'react';
import {Dimensions, Platform, RefreshControl, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {DataProvider, LayoutProvider, RecyclerListView} from 'recyclerlistview';
import {COLORS_NOTE, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {
  eClearSearch,
  eOpenLoginDialog,
  eScrollEvent,
} from '../../services/events';
import {db, ToastEvent} from '../../utils/utils';
import {PressableButton} from '../PressableButton';
let {width, height} = Dimensions.get('window');

const header = {
  type: 'MAIN_HEADER',
};

const SimpleList = ({
  data,
  type,
  placeholder,
  RenderItem,
  focused,
  customRefresh,
  customRefreshing,
}) => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, user} = state;
  const searchResults = {...state.searchResults};
  const [refreshing, setRefreshing] = useState(false);
  const [dataProvider, setDataProvider] = useState(null);
  const insets = useSafeAreaInsets();
  const _onScroll = (event) => {
    if (!event) return;
    let y = event.nativeEvent.contentOffset.y;
    eSendEvent(eScrollEvent, y);
  };

  useEffect(() => {
    let mainData =
      searchResults.type === type && focused && searchResults.results.length > 0
        ? searchResults.results
        : data;

    let d = [header, ...mainData];
    /*  for (var i = 0; i < 10000; i++) {
      d = [...d,...data];
    }  */
    setDataProvider(
      new DataProvider((r1, r2) => {
        return r1 !== r2;
      }).cloneWithRows(d),
    );
  }, [data]);

  const _ListFooterComponent = data[0] ? (
    <View
      style={{
        height: 150,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: colors.nav,
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
        }}>
        - End -
      </Text>
    </View>
  ) : null;

  const RenderSectionHeader = ({item}) => (
    <Text
      style={{
        fontFamily: WEIGHT.bold,
        fontSize: SIZE.xs + 1,
        color: colors.accent,
        paddingHorizontal: 12,
        width: '100%',
        alignSelf: 'center',
        marginTop: 15,
        height: 30,
        paddingBottom: 5,
      }}>
      {item.title}
    </Text>
  );

  const _onRefresh = async () => {
    if (Platform.OS === 'ios') {
      dispatch({
        type: ACTIONS.SYNCING,
        syncing: true,
      });
    } else {
      setRefreshing(true);
    }
    try {
      let user = await db.user.get();
      dispatch({type: ACTIONS.USER, user: user});
      await db.sync();
      ToastEvent.show('Sync Complete', 'success');
    } catch (e) {
      ToastEvent.show(
        e.message,
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
          type: ACTIONS.SYNCING,
          syncing: false,
        });
      } else {
        setRefreshing(false);
      }
      dispatch({type: ACTIONS.ALL});
    }
  };

  const _ListEmptyComponent = (
    <View
      style={{
        height: '100%',
        width: '100%',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'center',
        opacity: 1,
        backgroundColor: colors.bg,
      }}>
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
          dim.height = 100;
          break;
        case 'notebook':
          dim.width = width;
          dim.height = 110;
          break;
        case 'topic':
          dim.width = width;
          dim.height = 80;
          break;
        case 'tag':
          dim.width = width;
          dim.height = 80;
          break;
        case 'header':
          dim.width = width;
          dim.height = 40;
          break;
        case 'MAIN_HEADER':
          dim.width = width;
          dim.height = user || !data[0] || selectionMode ? 0 : 40;
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
      case 'MAIN_HEADER':
        return <ListHeaderComponent type={type} />;
      case 'header':
        return <RenderSectionHeader item={data} />;

      default:
        return null;
    }
  };

  return !data || data.length === 0 ? (
    _ListEmptyComponent
  ) : (
    <RecyclerListView
      layoutProvider={_layoutProvider}
      dataProvider={dataProvider}
      rowRenderer={_renderRow}
      onScroll={_onScroll}
      scrollViewProps={{
        refreshControl: (
          <RefreshControl
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={150}
            onRefresh={customRefresh ? customRefresh : _onRefresh}
            refreshing={customRefresh ? customRefreshing : refreshing}
          />
        ),
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
        paddingTop:
          Platform.OS == 'ios'
            ? data[0] && !selectionMode
              ? 115
              : 115 - 60
            : data[0] && !selectionMode
            ? 155 - insets.top
            : 155 - insets.top - 60,
      }}
    />
  );
};

export default SimpleList;

const SearchHeader = () => {
  const [state, dispatch] = useTracked();
  const {colors} = state;
  const searchResults = {...state.searchResults};

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        height: 40,
      }}>
      <Text
        style={{
          fontFamily: WEIGHT.bold,
          color: colors.accent,
          fontSize: SIZE.xs,
        }}>
        Showing Results for {searchResults.keyword}
      </Text>
      <Text
        onPress={() => {
          eSendEvent(eClearSearch);
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
};

const LoginCard = () => {
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, user, currentScreen} = state;

  return (
    <View>
      {user || !data[0] || selectionMode ? null : (
        <PressableButton
          onPress={() => {
            eSendEvent(eOpenLoginDialog);
          }}
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
          customStyle={{
            width: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'flex-start',
            paddingHorizontal: 12,
            alignSelf: 'center',
            height: 40,
            borderRadius: 0,
            position: 'relative',
          }}>
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
              style={{
                textAlign: 'center',
                textAlignVertical: 'center',
              }}
              name="account-outline"
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
              You are not logged in
            </Text>
            <Text
              style={{
                color: COLORS_NOTE[currentScreen]
                  ? COLORS_NOTE[currentScreen]
                  : colors.accent,
                fontSize: SIZE.xxs,
              }}>
              Login to sync your {type}.
            </Text>
          </View>
        </PressableButton>
      )}
    </View>
  );
};

const ListHeaderComponent = (type) => {
  const [state, dispatch] = useTracked();
  const searchResults = {...state.searchResults};

  return searchResults.type === type && searchResults.results.length > 0 ? (
    <SearchHeader />
  ) : (
    <LoginCard type={type} />
  );
};
