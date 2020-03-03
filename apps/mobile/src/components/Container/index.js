import React, {useEffect, useState} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {br, opacity, pv, SIZE, WEIGHT} from '../../common/common';
import {useTracked} from '../../provider';
import {eSubscribeEvent, eUnSubscribeEvent} from '../../services/eventManager';
import {eScrollEvent, eOpenLoginDialog} from '../../services/events';
import {getElevation, h, w, ToastEvent} from '../../utils/utils';
import {Header} from '../header';
import {Search} from '../SearchInput';
import SelectionHeader from '../SelectionHeader';
import {DDS, db} from '../../../App';
import {ACTIONS} from '../../provider/actions';
export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

const AnimatedTouchableOpacity = Animatable.createAnimatableComponent(
  TouchableOpacity,
);

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
    } else {
      //setKeyword(text);
      if (type === 'notes') {
        searchResult = await db.notes.filter(text);
      } else if (type === 'notebooks') {
        searchResult = await db.notebooks.filter(text);
      } else if (type === 'topic') {
        return;
      } else {
        return;
      }

      if (searchResult && searchResult.length > 0) {
        dispatch({type: ACTIONS.SEARCH_RESULTS, results: searchResult});
      } else {
        ToastEvent.show('No search results found', 'error', 3000, () => {}, '');
      }
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
    dispatch({type: ACTIONS.SEARCH_RESULTS, results: []});
  };

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => {
        setButtonHide(true);
      }, 300);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        setButtonHide(false);
      }, 300);
    });
    return () => {
      Keyboard.removeListener('keyboardDidShow', () => {
        setTimeout(() => {
          setButtonHide(true);
        }, 300);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setTimeout(() => {
          setButtonHide(false);
        }, 300);
      });
    };
  }, []);

  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);

    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  });

  // Render

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.bg,
      }}>
      <KeyboardAvoidingView
        behavior="padding"
        enabled={Platform.OS === 'ios' ? true : false}
        style={{
          height: '100%',
        }}>
        {noSelectionHeader ? null : <SelectionHeader />}

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
            duration={250}
            style={{
              width: '100%',
              opacity: buttonHide ? 0 : 1,
              position: 'absolute',
              paddingHorizontal: 12,
              zIndex: 10,
              bottom: 15,
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
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
  );
};

export default Container;
