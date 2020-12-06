import React, {useEffect, useState} from 'react';
import {TextInput, View} from 'react-native';
import {useTracked} from '../../provider';
import SearchService from '../../services/SearchService';
import {inputRef} from '../../utils/Refs';
import {normalize, SIZE, WEIGHT} from '../../utils/SizeUtils';

export const SearchInput = (props) => {
  const [state] = useTracked();
  const {colors} = state;
  const [searchState, setSearchState] = useState('Search all notes');

  const updateSearchState = () => {
    setSearchState(SearchService.getSearchInformation().placeholder);
  };

  useEffect(() => {
    updateSearchState();
  }, []);

  /*  const clearSearch = () => {
    searchResult = null;
    inputRef.current?.setNativeProps({
      text: '',
    });
    dispatch({
      type: Actions.SEARCH_RESULTS,
      results: [],
    });
  }; */

  const onChangeText = async (value) => {
    await SearchService.search(value);
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          alignSelf: 'center',
          height: 50,
          paddingHorizontal: 12,
        },
        props.customStyle,
      ]}>
      <TextInput
        ref={inputRef}
        style={{
          fontFamily: WEIGHT.bold,
          color: colors.pri,
          fontSize: SIZE.xl,
          flexGrow: 1,
          flex: 1,
          flexWrap: 'wrap',
          padding:0,
          margin:0,
          marginBottom:5,
        }}
        onChangeText={onChangeText}
        numberOfLines={1}
        placeholder={searchState}
        placeholderTextColor={colors.icon}
      />
    </View>
  );
};
