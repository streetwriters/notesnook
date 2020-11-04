import React, {useEffect, useState} from 'react';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent,
} from '../../services/EventManager';
import {
  eClearSearch,
  eScrollEvent,
  eUpdateSearchState,
} from '../../utils/Events';
import {inputRef} from '../../utils/Refs';
import {selection} from '../../utils';
import Animated, {Easing} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TextInput, Text} from 'react-native';
import {br, normalize, SIZE, WEIGHT} from '../../utils/SizeUtils';
import {db} from '../../utils/DB';
import {DDS} from '../../services/DeviceDetection';
import {ActionIcon} from '../ActionIcon';
const {Value, timing, block} = Animated;

let searchResult = [];

let offsetY = 0;
let timeoutAnimate = null;
let animating = false;

const _marginAnim = new Value(0);
const _opacity = new Value(1);
const _borderAnim = new Value(1.5);

const animation = (margin, opacity, border) => {
  if (animating) return;
  animating = true;
  timing(_marginAnim, {
    toValue: margin,
    duration: 130,
    easing: Easing.inOut(Easing.ease),
  }).start();
  timing(_opacity, {
    toValue: opacity,
    duration: 140,
    easing: Easing.inOut(Easing.ease),
  }).start();
  timing(_borderAnim, {
    toValue: border,
    duration: 150,
    easing: Easing.inOut(Easing.ease),
  }).start();
  setTimeout(() => {
    animating = false;
  }, 200);
};

let timeout = null;

export const Search = (props) => {
  const [state, dispatch] = useTracked();
  const {colors, searchResults} = state;
  const [text, setText] = useState('');
  const [focus, setFocus] = useState(false);
  const [searchState, setSearchState] = useState({
    noSearch: false,
    data: [],
    type: 'notes',
    color: null,
    placeholder: 'Search all notes',
  });

  const onScroll = (y) => {
    if (searchResults.results.length > 0) return;

    if (y < 30) {
      clearTimeout(timeoutAnimate);
      timeoutAnimate = null;
      animation(0, 1, 1.5);
      offsetY = y;
      return;
    }
    if (y > offsetY) {
      if (y - offsetY < 100) return;
      clearTimeout(timeoutAnimate);
      timeoutAnimate = null;
      timeoutAnimate = setTimeout(() => {
        animation(-65, 0, 0);
      }, 300);
      offsetY = y;
    } else {
      if (offsetY - y < 50) return;
      clearTimeout(timeoutAnimate);
      timeoutAnimate = null;
      timeoutAnimate = setTimeout(() => {
        animation(0, 1, 1.5);
      }, 300);
      offsetY = y;
    }
  };

  const updateSearchState = (state) => {
    setSearchState(state);
  };

  useEffect(() => {
    selection.data = searchState.data;
    selection.type = searchState.type;
    eSubscribeEvent(eScrollEvent, onScroll);
    eSubscribeEvent('showSearch', (hide) => {
      if (hide) {
        animation(-65, 0, 0);
        return;
      }
      animation(0, 1, 1.5);
    });

    eSubscribeEvent(eUpdateSearchState, updateSearchState);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
      eUnSubscribeEvent('showSearch', (hide) => {
        if (hide) {
          animation(-65, 0, 0);
          return;
        }
        animation(0, 1, 1.5);
      });
      eUnSubscribeEvent(eUpdateSearchState, updateSearchState);
    };
  }, [searchState]);

  const clearSearch = () => {
    if (searchResult && searchResult.length > 0) {
      searchResult = null;
      setText(null);

      inputRef.current?.setNativeProps({
        text: '',
      });
      dispatch({
        type: Actions.SEARCH_RESULTS,
        results: {
          results: [],
          type: null,
          keyword: null,
        },
      });
    } else {
      dispatch({
        type: Actions.SEARCH_RESULTS,
        results: {
          results: [],
          type: null,
          keyword: null,
        },
      });
    }
  };

  useEffect(() => {
    eSubscribeEvent(eClearSearch, clearSearch);
    return () => {
      eUnSubscribeEvent(eClearSearch, clearSearch);
    };
  }, []);

  useEffect(() => {
    if (!text || text.length === 0) {
      clearSearch();
    }
  }, [text]);

  const onChangeText = (value) => {
    setText(value);
  };

  const onSubmitEditing = async () => {
    if (!text || text.length < 1) {
      clearSearch();
      return;
    }

    let type = searchState.type;
    if (!type) return;

    let data = searchState.data;

    searchResult = await db.lookup[type](
      data[0].data ? db.notes.all : data,
      text,
    );
    if (!searchResult || searchResult.length === 0) {
      ToastEvent.show('No search results found for ' + text, 'error');
    } else {
      dispatch({
        type: Actions.SEARCH_RESULTS,
        results: {
          type,
          results: searchResult,
          keyword: text,
        },
      });
    }
  };

  const onBlur = () => {
    if (searchResult && searchResult.length === 0) {
      clearSearch();
    }
  };

  const onFocus = () => {
    //setSearch(false);
  };

  return (
    <Animated.View
      style={{
        opacity: _opacity,
        height: 60,
        justifyContent: 'center',
        marginTop: _marginAnim,
        paddingHorizontal: 12,
      }}>
      <Animated.View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          alignSelf: 'center',
          borderRadius: br,
          height: normalize(55),
          backgroundColor: focus
            ? searchState.color
              ? searchState.color
              : colors.shade
            : colors.nav,
        }}>
        <ActionIcon
          customStyle={{
            width: 50,
            height: 50,
          }}
          name="magnify"
          color={
            focus
              ? searchState.color
                ? searchState.color
                : colors.accent
              : colors.icon
          }
          size={SIZE.xxl}
        />
        <TextInput
          ref={inputRef}
          style={{
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            fontSize: SIZE.md,
            flexGrow: 1,
            flex: 1,
            flexWrap: 'wrap',
          }}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onFocus={() => {
            setFocus(true);
            onFocus();
          }}
          onBlur={() => {
            setFocus(false);
            onBlur();
          }}
          numberOfLines={1}
          placeholder={searchState.placeholder}
          placeholderTextColor={colors.icon}
        />
        <ActionIcon
          customStyle={{
            width: 50,
            height: 50,
          }}
          name="tune"
          color={colors.icon}
          size={SIZE.xxl}
        />
      </Animated.View>
    </Animated.View>
  );
};
