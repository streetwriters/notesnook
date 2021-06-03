import React, {useCallback, useEffect} from 'react';
import {ContainerTopSection} from '../../components/Container/ContainerTopSection';
import {Header} from '../../components/Header';
import SelectionHeader from '../../components/SelectionHeader';
import SimpleList from '../../components/SimpleList';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import SearchService from '../../services/SearchService';
import {inputRef} from '../../utils/Refs';
import {sleep} from '../../utils/TimeUtils';

export const Search = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {searchResults, searching, searchStatus} = state;

  const onFocus = useCallback(() => {
    sleep(300).then(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      dispatch({
        type: Actions.SEARCH_RESULTS,
        results: [],
      });
      dispatch({
        type: Actions.SEARCHING,
        searching: {
          isSearching: false,
          status: null,
        },
      });
      navigation.removeListener('focus', onFocus);
    };
  }, []);

  return (
    <>
      <SelectionHeader screen="Search" />
      <ContainerTopSection>
        <Header title="Search" isBack={true} screen="Search" />
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
            `Type a keyword to search in ${
              SearchService.getSearchInformation().title
            }`,
          button: null,
          loading: 'Searching...',
        }}
      />
    </>
  );
};
