import React, {useEffect, useState} from 'react';
import {Platform, TextInput, View} from 'react-native';
import {useTracked} from '../../provider';
import SearchService from '../../services/SearchService';
import {inputRef} from '../../utils/Refs';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';

let searchTerm;
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

  const onChangeText = async (value) => {
    searchTerm = value;
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
          padding: 0,
          margin: 0,
          marginBottom: Platform.OS === 'ios' ? 5 : 0,
        }}
        textAlignVertical="center"
        onChangeText={onChangeText}
        numberOfLines={1}
        onSubmitEditing={async () => {
          await SearchService.search(searchTerm);
        }}
        enablesReturnKeyAutomatically
        placeholder={searchState}
        placeholderTextColor={colors.icon}
      />
    </View>
  );
};
