import React, { useCallback, useEffect } from 'react';
import SimpleList from '../../components/SimpleList';
import { useTracked } from '../../provider';
import { Actions } from '../../provider/Actions';
import { inputRef } from '../../utils/Refs';
import { sleep } from '../../utils/TimeUtils';

export const Search = ({route, navigation}) => {
  const [state, dispatch] = useTracked();
  const {colors, searchResults} = state;

  const onFocus = useCallback(() => {
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'search',
    });

    dispatch({
      type: Actions.HEADER_STATE,
      state: false,
    });


    sleep(300).then(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    return () => {
      navigation.removeListener('focus', onFocus);
    };
  });

  return (
    <>
      <SimpleList
        data={searchResults}
        type="search"
        focused={() => navigation.isFocused()}
        placeholderText={`Notes you write appear here`}
        jumpToDialog={true}
        CustomHeader={true}
        placeholderData={{
          heading: 'Search',
          paragraph: 'Type a keyword to search in notes.',
          button: null,
        }}
      />
    </>
  );
};
