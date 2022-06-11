import React, { useEffect } from 'react';
import { ContainerHeader } from '../../components/container/containerheader';
import List from '../../components/list';
import SearchService from '../../services/search';
import useNavigationStore from '../../stores/use-navigation-store';
import { useSearchStore } from '../../stores/use-search-store';
import { inputRef } from '../../utils/global-refs';
import { useNavigationFocus } from '../../utils/hooks/use-navigation-focus';
import { sleep } from '../../utils/time';
import { SearchBar } from './search-bar';

export const Search = ({ navigation, route }) => {
  const searchResults = useSearchStore(state => state.searchResults);
  const searching = useSearchStore(state => state.searching);
  const searchStatus = useSearchStore(state => state.searchStatus);
  const setSearchResults = useSearchStore(state => state.setSearchResults);
  const setSearchStatus = useSearchStore(state => state.setSearchStatus);

  useNavigationFocus(navigation, {
    onFocus: () => {
      sleep(300).then(() => inputRef.current?.focus());
      useNavigationStore.getState().update({
        name: route.name
      });
      return false;
    },
    onBlur: () => false
  });

  useEffect(() => {
    return () => {
      setSearchResults([]);
      setSearchStatus(false, null);
    };
  }, []);

  return (
    <>
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
