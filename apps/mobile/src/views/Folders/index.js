import React, {useEffect, useState} from 'react';
import {FlatList, Platform, Text, View, BackHandler} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useIsFocused} from 'react-navigation-hooks';
import {SIZE, WEIGHT} from '../../common/common';
import {AddNotebookDialog} from '../../components/AddNotebookDialog';
import Container from '../../components/Container';
import {Header} from '../../components/header';
import {NotebookPlaceHolder} from '../../components/ListPlaceholders';
import {NotebookItem} from '../../components/NotebookItem';
import {Search} from '../../components/SearchInput';
import SelectionHeader from '../../components/SelectionHeader';
import SelectionWrapper from '../../components/SelectionWrapper';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {slideLeft, slideRight} from '../../utils/animations';
import {w} from '../../utils/utils';
import {AddNotebookEvent} from '../../components/DialogManager';
import {DDS} from '../../../App';

export const Folders = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {
    colors,
    selectionMode,
    pinned,
    notebooks,
    preventDefaultMargins,
    selectedItemsList,
  } = state;
  let isFocused = useIsFocused();
  ///

  const handleBackPress = () => {
    alert('here');
    return true;
  };

  useEffect(() => {
    dispatch({type: ACTIONS.NOTEBOOKS});
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

  const [addNotebook, setAddNotebook] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);

  const params = navigation.state.params;
  let offsetY = 0;
  let countUp = 0;
  let countDown = 0;

  const onScroll = event => {
    y = event.nativeEvent.contentOffset.y;
    if (y < 30) setHideHeader(false);
    //if (buttonHide) return;
    if (y > offsetY) {
      if (y - offsetY < 150 || countDown > 0) return;
      countDown = 1;
      countUp = 0;
      setHideHeader(true);
    } else {
      if (offsetY - y < 150 || countUp > 0) return;
      countDown = 0;
      countUp = 1;
      setHideHeader(false);
    }
    offsetY = y;
  };

  return (
    <Container
      bottomButtonText="Add a new notebook"
      bottomButtonOnPress={() => {
        AddNotebookEvent(null);
      }}>
      <SelectionHeader />

      <Animatable.View
        transition={['backgroundColor', 'opacity', 'height']}
        duration={300}
        style={{
          position: 'absolute',
          backgroundColor: colors.bg,
          height: selectionMode ? 0 : null,
          opacity: selectionMode ? 0 : 1,
          zIndex: 20,
          width: '100%',
        }}>
        <Header
          hide={hideHeader}
          menu={params.canGoBack ? false : true}
          preventDefaultMargins={preventDefaultMargins}
          navigation={navigation}
          showSearch={() => {
            setHideHeader(false);
            countUp = 0;
            countDown = 0;
          }}
          colors={colors}
          heading={params.title}
          canGoBack={params.canGoBack}
        />
        {notebooks.length == 0 ? null : (
          <Search placeholder="Search your notebook" hide={hideHeader} />
        )}
      </Animatable.View>

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
