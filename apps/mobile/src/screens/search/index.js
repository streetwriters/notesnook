import React, { useCallback, useEffect } from 'react';
import { ContainerHeader } from '../../components/container/containerheader';
import SelectionHeader from '../../components/selection-header';
import List from '../../components/list';
import { useSearchStore } from '../../stores/stores';
import SearchService from '../../services/search';
import { inputRef } from '../../utils/global-refs';
import { sleep } from '../../utils/time';
import { SearchBar } from './search-bar';

export const Search = ({ navigation }) => {
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
      <ContainerHeader>
        <SearchBar />
      </ContainerHeader>
      <List
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
