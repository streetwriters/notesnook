import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Platform, RefreshControl, StyleSheet, Text, useWindowDimensions, View} from 'react-native';
import {initialWindowMetrics} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {DataProvider, LayoutProvider, RecyclerListView} from 'recyclerlistview';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {eSendEvent, ToastEvent} from '../../services/EventManager';
import {eClearSearch, eOpenLoginDialog, eScrollEvent,} from '../../utils/Events';
import {PressableButton} from '../PressableButton';
import {COLORS_NOTE} from "../../utils/Colors";
import {SIZE, WEIGHT} from "../../utils/SizeUtils";
import {db} from "../../utils/DB";

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
                        refreshCallback,
                    }) => {
    const [state, dispatch] = useTracked();
    const {colors, selectionMode, user} = state;
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
        if (!event) return;
        let y = event.nativeEvent.contentOffset.y;
        eSendEvent(eScrollEvent, y);
    };

    useEffect(() => {
        loadData();
    }, [listData]);

    const loadData =() => {
        let mainData =
            searchResults.type === type &&
            focused() &&
            searchResults.results.length > 0
                ? searchResults.results
                : listData;

        let d = [header, ...mainData];
        console.log(d,"D");
        setDataProvider(
            dataProvider.cloneWithRows(d),
        );
    }

    const RenderSectionHeader = ({item}) => (
        <Text
            style={[
                {
                    color: colors.accent,
                },
                styles.sectionHeader,
            ]}>
            {item.title}
        </Text>
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
                "You must login to sync.",
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
            console.log(type);
            switch (type) {
                case 'note':
                    dim.width = width;
                    dim.height = 100 * fontScale;
                    break;
                case 'notebook':
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
                        (user && user.Id) || !listData[0] || selectionMode
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
                return <RenderItem item={data} pinned={data.pinned} index={index}/>;
            case 'notebook':
                return <RenderItem item={data} pinned={data.pinned} index={index}/>;
            case 'MAIN_HEADER':
                return <ListHeaderComponent type={dataType} data={listData}/>;
            case 'header':
                return <RenderSectionHeader item={data}/>;

            default:
                return null;
        }
    };

    const listStyle = useMemo(() => {
        return {
            height: '100%',
            backgroundColor: colors.bg,
            width: '100%',
            paddingTop:
                Platform.OS === 'ios'
                    ? listData[0] && !selectionMode
                    ? 130
                    : 130 - 60
                    : listData[0] && !selectionMode
                    ? 155 - initialWindowMetrics.insets.top
                    : 155 - initialWindowMetrics.insets.top - 60,
        };
    }, [selectionMode, listData, colors]);

    return !listData || listData.length === 0 || !dataProvider ? (
        _ListEmptyComponent
    ) : (
        <RecyclerListView
            layoutProvider={_layoutProvider}
            dataProvider={dataProvider}
            rowRenderer={_renderRow}
            onScroll={_onScroll}
            renderFooter={() => <View style={{height:400}} />}
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
            style={listStyle}
        />
    );
};

export default SimpleList;

const SearchHeader = () => {
    const [state,] = useTracked();
    const {colors} = state;
    const searchResults = {...state.searchResults};

    return (
        <View style={styles.searchHeader}>
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

const LoginCard = ({type, data}) => {
    const [state,] = useTracked();
    const {colors, selectionMode, user, currentScreen} = state;

    return (
        <View>
            {(user && user.Id) || !data[0] || selectionMode ? null : (
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

const ListHeaderComponent = ({type, data}) => {
    const [state,] = useTracked();
    const searchResults = {...state.searchResults};

    return searchResults.type === type && searchResults.results.length > 0 ? (
        <SearchHeader/>
    ) : (
        <LoginCard type={type} data={data}/>
    );
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
        paddingHorizontal: 12,
        width: '100%',
        alignSelf: 'center',
        marginTop: 10,
        height: 25,
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
