import React, { useCallback, useEffect } from 'react';
import { ContainerTopSection } from '../../components/Container/ContainerTopSection';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { useSearchStore } from '../../provider/stores';
import SearchService from '../../services/SearchService';
import { inputRef } from '../../utils/Refs';
import { sleep } from '../../utils/TimeUtils';
import { SearchBar } from './search-bar';

export const Search = ({ route, navigation }) => {
  const [state, dispatch] = useTracked();

  const searchResults = useSearchStore(state => state.searchResults);
  const searching = useSearchStore(state => state.searching);
  const searchStatus = useSearchStore(state => state.searchStatus);
  const setSearchResults = useSearchStore(state => state.setSearchResults);
  const setSearchStatus = useSearchStore(state => state.setSearchStatus);

  const onFocus = useCallback(() => {
    sleep(300).then(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      setSearchResults([]);
      setSearchStatus(false, null);
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  return (
    <>
      <SelectionHeader screen="Search" />
      <ContainerTopSection>
        <SearchBar />
      </ContainerTopSection>
      <SimpleList
        listData={searchResults}
        type="search"
        screen="Search"
        focused={() => navigation.isFocused()}
        placeholderText={`Notes you write appear here`}
        jumpToDialog={true}
        loading={searching}
        CustomHeader={true}
        placeholderData={{
          heading: 'Search',
          paragraph:
            searchStatus ||
            `Type a keyword to search in ${SearchService.getSearchInformation().title}`,
          button: null,
          loading: 'Searching...'
        }}
      />
    </>
  );
};
