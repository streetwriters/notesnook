import React, {useEffect, useRef, useState} from 'react';
import {View} from 'react-native';
import {TextInput} from 'react-native-gesture-handler';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {ActionIcon} from '../../components/ActionIcon';
import {useTracked} from '../../provider';
import {useSearchStore} from '../../provider/stores';
import {
  eSubscribeEvent,
  eUnSubscribeEvent,
  ToastEvent
} from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import SearchService from '../../services/SearchService';
import {eScrollEvent} from '../../utils/Events';
import {normalize, SIZE} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';

export const SearchBar = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [focused, setFocused] = useState(false);
  const [value, setValue] = useState(null);
  const inputRef = useRef();
  const setSearchResults = useSearchStore(state => state.setSearchResults);
  const setSearchStatus = useSearchStore(state => state.setSearchStatus);
  const searchingRef = useRef(0);
  const insets = useSafeAreaInsets();
  const onClear = () => {
    //inputRef.current?.blur();
    inputRef.current?.clear();
    setValue(0);
    SearchService.setTerm(null);
    setSearchResults([]);
    setSearchStatus(false, null);
  };

  useEffect(() => {
    sleep(300).then(() => {
      inputRef.current?.focus();
    });
  }, []);

  const onScroll = event => {
    console.log(event);
  };
  useEffect(() => {
    eSubscribeEvent(eScrollEvent, onScroll);
    return () => {
      eUnSubscribeEvent(eScrollEvent, onScroll);
    };
  });

  const onChangeText = value => {
    setValue(value);
    search(value);
  };

  const search = value => {
    clearTimeout(searchingRef.current);
    searchingRef.current = setTimeout(async () => {
      try {
        if (value === '' || !value) {
          setSearchResults([]);
          setSearchStatus(false, null);
          return;
        }
        if (value?.length > 0) {
          SearchService.setTerm(value);
          await SearchService.search();
        }
      } catch (e) {
        console.log(e);
        ToastEvent.show({
          heading: 'Error occured while searching',
          message: e.message,
          type: 'error'
        });
      }
    }, 500);
  };

  return (
    <View
      style={{
        height: normalize(50),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        flexShrink: 1,
        width: '100%',
        paddingLeft: 6,
        marginTop: Platform.OS === 'android' ? insets.top + 5 : 5,
        borderBottomWidth: 1,
        borderBottomColor: colors.nav
      }}>
      <ActionIcon
        name="arrow-left"
        size={SIZE.xl}
        top={10}
        bottom={10}
        onPress={() => {
          SearchService.setTerm(null);
          Navigation.goBack();
        }}
        color={colors.pri}
        type="gray"
        customStyle={{
          paddingLeft: 0,
          marginLeft: 0,
          marginRight: 5
        }}
      />

      <TextInput
        ref={inputRef}
        style={{
          fontSize: SIZE.md + 1,
          fontFamily: 'OpenSans-Regular',
          flexGrow: 1,
          height: '100%',
          color: colors.pri
        }}
        onChangeText={onChangeText}
        placeholder="Type a keyword"
        textContentType="none"
        returnKeyLabel="Search"
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor={colors.placeholder}
      />

      {value && value.length > 0 ? (
        <ActionIcon
          name="close"
          size={SIZE.md + 2}
          top={20}
          bottom={20}
          right={20}
          onPress={onClear}
          type="grayBg"
          color={colors.icon}
          customStyle={{
            width: 25,
            height: 25
          }}
        />
      ) : null}
    </View>
  );
};
