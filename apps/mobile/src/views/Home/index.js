import React, {useEffect, useState} from 'react';
import {SafeAreaView} from 'react-native';
import {Search} from '../../components/SearchInput';
import {w, h, SideMenuEvent, ToastEvent} from '../../utils/utils';
import {Header} from '../../components/header';
import {NotesList} from '../../components/NotesList';
import {db} from '../../../App';
import NavigationService from '../../services/NavigationService';
import * as Animatable from 'react-native-animatable';
import {useAppContext} from '../../provider/useAppContext';
import {DDS} from '../../../App';
import Container from '../../components/Container';
import SelectionHeader from '../../components/SelectionHeader';
import {useIsFocused} from 'react-navigation-hooks';
import {useTracked} from '../../provider';

export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);
let intervals;
let counter = 0;

export const Home = ({navigation}) => {
  // State

  const [state, dispatch] = useTracked();
  const {colors, selectionMode, notes} = state;

  ///
  const updateDB = () => {};
  const updateSelectionList = () => {};
  const changeSelectionMode = () => {};

  const [text, setText] = useState('');
  const [hideHeader, setHideHeader] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Variables
  let isFocused = useIsFocused();

  let offsetY = 0;
  let countUp = 1;
  let countDown = 0;
  let searchResult = null;

  // Effects

  useEffect(() => {
    dispatch({type: 'updateNotes', boo: 'hoo'});
  }, []);

  // Functions

  const onChangeText = value => {
    setText(value);
  };
  const onSubmitEditing = async () => {
    if (!text || text.length < 1) {
      clearSearch();
    } else {
      setKeyword(text);
      searchResult = await db.searchNotes(text);

      if (searchResult && searchResult.length > 0) {
        setSearchResults([...searchResult]);
      } else {
        ToastEvent.show('No search results found', 'error', 3000, () => {}, '');
      }
    }
  };

  const onBlur = () => {
    if (text && text.length < 1) {
      clearSearch();
    }
  };

  const onFocus = () => {
    //setSearch(false);
  };

  const clearSearch = () => {
    searchResult = null;
    setSearchResults([...[]]);
  };

  const onScroll = y => {
    if (searchResults.length > 0) return;
    if (y < 30) setHideHeader(false);
    if (y > offsetY) {
      if (y - offsetY < 150 || countDown > 0) return;
      countDown = 1;
      countUp = 0;
      setHideHeader(true);
    } else {
      if (offsetY - y < 150 || countUp > 0) return;
      countDown = 0;
      countUp = 1;
      setHideHeader(false);
    }
    offsetY = y;
  };

  // Render

  return (
    <Container
      bottomButtonText="Add a new note"
      bottomButtonOnPress={() => {
        SideMenuEvent.close();
        SideMenuEvent.disable();
        NavigationService.navigate('Editor');
      }}>
      <SelectionHeader />
      <Animatable.View
        transition={['backgroundColor', 'opacity', 'height']}
        duration={300}
        style={{
          position: 'absolute',
          backgroundColor: colors.bg,
          zIndex: 10,
          height: selectionMode ? 0 : null,
          opacity: selectionMode ? 0 : 1,
          width: '100%',
        }}>
        <Header
          menu
          hide={hideHeader}
          verticalMenu
          showSearch={() => {
            setHideHeader(false);
            countUp = 0;
            countDown = 0;
          }}
          colors={colors}
          heading={'Home'}
          canGoBack={false}
          customIcon="menu"
        />

        {notes[0] ? (
          <Search
            clear={() => setText('')}
            hide={hideHeader}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmitEditing}
            placeholder="Search your notes"
            onBlur={onBlur}
            onFocus={onFocus}
            clearSearch={clearSearch}
            value={text}
          />
        ) : null}
      </Animatable.View>

      <NotesList
        isGrouped={true}
        onScroll={onScroll}
        isSearch={searchResults.length > 0 ? true : false}
        notes={searchResults.length > 0 ? searchResults : notes}
        keyword={keyword}
      />
    </Container>
  );
};

Home.navigationOptions = {
  header: null,
  headerStyle: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    height: 0,
  },
};

export default Home;
