import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {br, opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eScrollEvent, eClearSearch} from '../../services/events';
import {db, getElevation, ToastEvent, DDS, selection} from '../../utils/utils';
import {Header} from '../header';
import {Search} from '../SearchInput';
import SelectionHeader from '../SelectionHeader';
import {inputRef} from '../../utils/refs';
import {useSafeArea} from 'react-native-safe-area-context';

const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);

const AnimatedSafeAreaView = Animatable.createAnimatableComponent(SafeAreaView);

export const Container = ({
  children,
  bottomButtonOnPress,
  bottomButtonText,
  noBottomButton = false,
  data = [],
  heading,
  canGoBack = true,
  menu,
  customIcon,
  verticalMenu = false,
  preventDefaultMargins,
  navigation = null,
  isLoginNavigator,
  placeholder = '',
  noSearch = false,
  noSelectionHeader = false,
  headerColor = null,
  type = null,
}) => {
  // State
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, searchResults, loading} = state;
  const [text, setText] = useState('');
  const [hideHeader, setHideHeader] = useState(false);
  const [buttonHide, setButtonHide] = useState(false);
  const insets = useSafeArea();
  let offsetY = 0;
  let countUp = 1;
  let countDown = 0;
  let searchResult = [];

  const onScroll = y => {
    if (searchResults.length > 0) return;
    if (y < 30) {
      countUp = 1;
      countDown = 0;
      setHideHeader(false);
    }

    if (y > offsetY) {
      if (y - offsetY < 150 || countDown > 0) return;
      countDown = 1;
      countUp = 0;
      setHideHeader(true);
    } else {
      if (offsetY - y < 50 || countUp > 0) return;
      countDown = 0;
      countUp = 1;
      setHideHeader(false);
    }
    offsetY = y;
  };

  const onChangeText = value => {
    setText(value);
  };
  const onSubmitEditing = async () => {
    if (!text || text.length < 1) {
      ToastEvent.show('Please enter a search keyword');
      clearSearch();
      return;
    }
    if (!type) return;

    searchResult = await db.lookup[type](
      data[0].data ? db.notes.all : data,
      text,
    );
    if (!searchResult || searchResult.length === 0) {
      ToastEvent.show('No search results found for ' + text, 'error');
      return;
    } else {
      dispatch({
        type: ACTIONS.SEARCH_RESULTS,
        results: {
          type,
          results: searchResult,
          keyword: text,
        },
      });
    }
  };

  const onBlur = () => {
    if (text && text.length < 1) {
      clearSearch();
    }
  };

  const onFocus = () => {
    //setSearch(false);
  };

  const clearSearch = () => {
    searchResult = null;
    setText(null);
    inputRef.current?.setNativeProps({
      text: '',
    });
    dispatch({
      type: ACTIONS.SEARCH_RESULTS,
      results: {
        results: [],
        type: null,
        keyword: null,
      },
    });
  };

  useEffect(() => {
    eSubscribeEvent(eClearSearch, clearSearch);
    Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        if (DDS.isTab) return;
        setButtonHide(true);
      }, 300);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        if (DDS.isTab) return;
        setButtonHide(false);
      }, 0);
    });
    return () => {
      eUnSubscribeEvent(eClearSearch, clearSearch);
      Keyboard.removeListener('keyboardDidShow', () => {
        setTimeout(() => {
          if (DDS.isTab) return;
          setButtonHide(true);
        }, 300);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setTimeout(() => {
          if (DDS.isTab) return;
          setButtonHide(false);
        }, 0);
      });
    };
  }, []);

  useEffect(() => {
    selection.data = data;
    selection.type = type;
    eSubscribeEvent(eScrollEvent, onScroll);

    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  });

  // Render

  return (
    <KeyboardAvoidingView
      behavior="padding"
      enabled={Platform.OS === 'ios' ? true : false}>
      <AnimatedSafeAreaView
        transition="backgroundColor"
        duration={300}
        style={{
          height: '100%',
          backgroundColor: colors.bg,
          paddingTop: insets.top,
        }}>
        {noSelectionHeader ? null : <SelectionHeader items={data} />}

        <View
          style={{
            position: selectionMode ? 'relative' : 'absolute',
            backgroundColor: colors.bg,
            zIndex: 999,
            display: selectionMode ? 'none' : 'flex',
            width: '100%',
          }}>
          <Header
            menu={menu}
            hide={hideHeader}
            verticalMenu={verticalMenu}
            showSearch={() => {
              setHideHeader(false);
              countUp = 0;
              countDown = 0;
            }}
            headerColor={headerColor}
            navigation={navigation}
            colors={colors}
            isLoginNavigator={isLoginNavigator}
            preventDefaultMargins={preventDefaultMargins}
            heading={heading}
            canGoBack={canGoBack}
            customIcon={customIcon}
          />

          {data[0] && !noSearch ? (
            <Search
              clear={() => setText('')}
              hide={hideHeader}
              onChangeText={onChangeText}
              headerColor={headerColor}
              onSubmitEditing={onSubmitEditing}
              placeholder={placeholder}
              onBlur={onBlur}
              onFocus={onFocus}
              clearSearch={clearSearch}
              value={text}
            />
          ) : null}
        </View>

        {children}

        {noBottomButton ? null : (
          <Animatable.View
            transition={['translateY', 'opacity']}
            useNativeDriver={true}
            duration={300}
            style={{
              width: '100%',
              opacity: buttonHide ? 0 : 1,
              position: 'absolute',
              paddingHorizontal: 12,
              bottom: insets.bottom + 20,
              zIndex: 10,
              transform: [
                {
                  translateY: buttonHide ? 200 : 0,
                },
              ],
            }}>
            <AnimatedTouchableOpacity
              onPress={bottomButtonOnPress}
              activeOpacity={opacity}
              style={{
                ...getElevation(5),
                width: '100%',

                alignSelf: 'center',
                borderRadius: br,
                backgroundColor: headerColor ? headerColor : colors.accent,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 0,
              }}>
              <View
                style={{
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  flexDirection: 'row',
                  width: '100%',
                  padding: pv,
                  paddingVertical: pv + 5,
                }}>
                <Icon name="plus" color="white" size={SIZE.xl} />
                <Text
                  style={{
                    fontSize: SIZE.md,
                    color: 'white',
                    fontFamily: WEIGHT.regular,
                    textAlignVertical: 'center',
                  }}>
                  {'  ' + bottomButtonText}
                </Text>
              </View>
            </AnimatedTouchableOpacity>
          </Animatable.View>
        )}
      </AnimatedSafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default Container;
