import React, {useEffect, useState} from 'react';
import {Platform, TextInput, View} from 'react-native';
import {useTracked} from '../../provider';
import SearchService from '../../services/SearchService';
import {inputRef} from '../../utils/Refs';
import {SIZE} from '../../utils/SizeUtils';

export const SearchInput = props => {
  const [state] = useTracked();
  const {colors} = state;
  const [searchState, setSearchState] = useState('Search all notes');

  const updateSearchState = () => {
    setSearchState(SearchService.getSearchInformation().placeholder);
  };

  useEffect(() => {
    updateSearchState();

    return () => {
      SearchService.setTerm(null);
    };
  }, []);

  const onChangeText = async value => {
    SearchService.setTerm(value);
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
          color: colors.pri,
          fontSize: SIZE.xl,
          flexGrow: 1,
          flexWrap: 'wrap',
          padding: 0,
          paddingVertical: 0,
          paddingHorizontal: 0,
          margin: 0,
          fontFamily: 'OpenSans-SemiBold',
        }}
        returnKeyLabel="Search"
        returnKeyType="search"
        textAlignVertical="center"
        onChangeText={onChangeText}
        multiline={false}
        onSubmitEditing={async () => {
          await SearchService.search();
        }}
        enablesReturnKeyAutomatically
        placeholder="Type a keyword"
        placeholderTextColor={colors.placeholder}
      />
    </View>
  );
};
