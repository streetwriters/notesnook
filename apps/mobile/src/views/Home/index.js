import React, {useEffect, useState} from 'react';
import {DeviceEventEmitter, SafeAreaView} from 'react-native';
import * as Animatable from 'react-native-animatable';
import {useIsFocused} from 'react-navigation-hooks';
import {db, DDS} from '../../../App';
import Container from '../../components/Container';
import {Header} from '../../components/header';
import {NotesList} from '../../components/NotesList';
import {Search} from '../../components/SearchInput';
import SelectionHeader from '../../components/SelectionHeader';
import {useTracked} from '../../provider';
import {ACTIONS} from '../../provider/actions';
import NavigationService from '../../services/NavigationService';
import {SideMenuEvent, ToastEvent} from '../../utils/utils';

export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const Home = ({navigation}) => {
  // State
  const [state, dispatch] = useTracked();
  const {colors, selectionMode, notes} = state;
  const [text, setText] = useState('');
  const [hideHeader, setHideHeader] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState([]);
  const isFocused = useIsFocused();
  // Variables

  let offsetY = 0;
  let countUp = 1;
  let countDown = 0;
  let searchResult = null;

  // Effects

  useEffect(() => {
    dispatch({type: ACTIONS.NOTES});
    setTimeout(() => {
      setLoading(false);
    }, 2500);
  }, [isFocused]);

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
        dispatch({type: ACTIONS.NOTES});

        if (DDS.isTab) {
          eSendEvent(eOnLoadNote, {type: 'new'});
        } else {
          SideMenuEvent.close();
          SideMenuEvent.disable();
          NavigationService.navigate('Editor');
        }
      }}>
      <SelectionHeader />

      <Animatable.View
        animation="fadeIn"
        useNativeDriver={true}
        duration={600}
        delay={700}>
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
      </Animatable.View>

      <NotesList
        isGrouped={true}
        onScroll={onScroll}
        isSearch={searchResults.length > 0 ? true : false}
        searchResults={searchResults.length > 0 ? searchResults : null}
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
