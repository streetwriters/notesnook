import React, {useEffect} from 'react';
import {BackHandler, FlatList, Platform, Text, View} from 'react-native';
import {useIsFocused} from 'react-navigation-hooks';
import {DDS} from '../../../App';
import {SIZE, WEIGHT} from '../../common/common';
import Container from '../../components/Container';
import {AddNotebookEvent} from '../../components/DialogManager';
import {NotebookPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSendEvent} from '../../services/eventManager';
import {eScrollEvent} from '../../services/events';
import {slideLeft, slideRight} from '../../utils/animations';
import {w} from '../../utils/utils';

export const Folders = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {
    colors,
    selectionMode,
    pinned,
    notebooks,
    preventDefaultMargins,
  } = state;
  let isFocused = useIsFocused();
  ///

  const handleBackPress = () => {
    alert('here');
    return true;
  };

  useEffect(() => {
    dispatch({type: ACTIONS.NOTEBOOKS});
    console.log(notebooks);
    let backhandler;
    if (isFocused) {
      backhandler = BackHandler.addEventListener(
        'hardwareBackPress',
        handleBackPress,
      );
    } else {
      if (backhandler) {
        backhandler.remove();
        backhandler = null;
      }
    }

    return () => {
      if (!backhandler) return;
      backhandler.remove();
      backhandler = null;
    };
  }, [isFocused]);

  const params = navigation.state.params;

  const onScroll = event => {
    let y = event.nativeEvent.contentOffset.y;

    eSendEvent(eScrollEvent, y);
  };

  return (
    <Container
      bottomButtonText="Add a new notebook"
      menu={params.canGoBack ? false : true}
      preventDefaultMargins={preventDefaultMargins}
      heading={params.title}
      canGoBack={params.canGoBack}
      navigation={navigation}
      placeholder="Search your notebook"
      data={notebooks}
      bottomButtonOnPress={() => {
        AddNotebookEvent(null);
      }}>
      <FlatList
        style={{
          width: '100%',
        }}
        onScroll={onScroll}
        ListHeaderComponent={
          <View
            style={{
              marginTop:
                Platform.OS == 'ios'
                  ? notebooks[0] && !selectionMode
                    ? 135
                    : 135 - 60
                  : notebooks[0] && !selectionMode
                  ? 155
                  : 155 - 60,
            }}>
            {pinned && pinned.length > 0 ? (
              <>
                <FlatList
                  data={pinned}
                  keyExtractor={(item, index) => item.dateCreated.toString()}
                  renderItem={({item, index}) =>
                    item.type === 'notebook' ? (
                      <SelectionWrapper item={item}>
                        <NotebookItem
                          hideMore={params.hideMore}
                          customStyle={{
                            width: selectionMode ? w - 74 : '100%',
                            marginHorizontal: 0,
                          }}
                          isMove={params.isMove}
                          onLongPress={() => {
                            dispatch({
                              type: ACTIONS.SELECTION_MODE,
                              enabled: !selectionMode,
                            });
                            dispatch({
                              type: ACTIONS.SELECTED_ITEMS,
                              item: item,
                            });
                          }}
                          noteToMove={params.note}
                          item={item}
                          pinned={true}
                          index={index}
                          colors={colors}
                        />
                      </SelectionWrapper>
                    ) : null
                  }
                />
              </>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          pinned && pinned.length > 0 ? null : (
            <View
              style={{
                height: '80%',
                width: DDS.isTab ? '70%' : '100%',
                alignItems: 'center',
                alignSelf: 'center',
                justifyContent: 'center',
                opacity: 0.8,
              }}>
              <NotebookPlaceHolder animation={slideRight} colors={colors} />
              <NotebookPlaceHolder animation={slideLeft} colors={colors} />
              <NotebookPlaceHolder animation={slideRight} colors={colors} />

              <Text
                style={{
                  color: colors.icon,
                  fontSize: SIZE.md,
                  fontFamily: WEIGHT.regular,
                  marginTop: 20,
                }}>
                Notebooks you add will appear here
              </Text>
              <Text
                style={{
                  fontSize: SIZE.sm,
                  color: colors.icon,
                  marginTop: 20,
                }}>
                No Notebooks found
              </Text>
            </View>
          )
        }
        contentContainerStyle={{
          width: '100%',
          alignSelf: 'center',
          minHeight: '100%',
        }}
        ListFooterComponent={
          <View
            style={{
              height: 150,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                color: colors.navbg,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
              }}>
              - End -
            </Text>
          </View>
        }
        data={notebooks}
        keyExtractor={(item, index) => item.dateCreated.toString()}
        renderItem={({item, index}) => (
          <SelectionWrapper item={item}>
            <NotebookItem
              hideMore={params.hideMore}
              navigation={navigation}
              customStyle={{
                width: selectionMode ? w - 74 : '100%',
                marginHorizontal: 0,
              }}
              isMove={params.isMove}
              onLongPress={() => {
                dispatch({
                  type: ACTIONS.SELECTION_MODE,
                  enabled: !selectionMode,
                });
                dispatch({
                  type: ACTIONS.SELECTED_ITEMS,
                  item: item,
                });
              }}
              noteToMove={params.note}
              item={item}
              index={index}
            />
          </SelectionWrapper>
        )}
      />
    </Container>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
