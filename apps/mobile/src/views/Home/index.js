import React, {useEffect, useState, createRef, useCallback} from 'react';
import {
  SafeAreaView,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Text,
  Keyboard,
} from 'react-native';
import {COLOR_SCHEME, opacity, pv, br, SIZE, WEIGHT} from '../../common/common';
import {Search} from '../../components/SearchInput';
import {w, h, SideMenuEvent} from '../../utils/utils';
import {Header} from '../../components/header';
import {NavigationEvents} from 'react-navigation';
import {NotesList} from '../../components/NotesList';
import {db} from '../../../App';
import Icon from 'react-native-vector-icons/Feather';
import NavigationService from '../../services/NavigationService';
import {useForceUpdate} from '../ListsEditor';
import * as Animatable from 'react-native-animatable';
import {useIsFocused} from 'react-navigation-hooks';
import {useAppContext} from '../../provider/useAppContext';
import {DDS} from '../../../App';
export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const Home = ({navigation}) => {
  // State
  const {colors, updateAppTheme, setMenuOpen} = useAppContext();

  const [search, setSearch] = useState(false);
  const [text, setText] = useState('');
  const [update, setUpdate] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(190);
  const [buttonHide, setButtonHide] = useState(false);
  const [notes, setNotes] = useState([]);
  const [keyword, setKeyword] = useState('');
  const isFocused = useIsFocused();
  // Variables
  let offsetY = 0;
  let countUp = 1;
  let countDown = 0;
  let headerHeight = 0;
  let searchHeight = 0;
  let marginSet = false;
  let searchResults = null;
  let allNotes = [];

  // Effects
  useEffect(() => {
    updateAppTheme(colors);
    DDS.isTab ? setMenuOpen() : null;
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    fetchNotes();
  }, [isFocused]);

  const fetchNotes = () => {
    allNotes = db.getNotes();
    setNotes(allNotes);
  };

  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setButtonHide(true);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        setButtonHide(false);
      }, 100);
    });
    return () => {
      Keyboard.removeListener('keyboardDidShow', () => {
        setButtonHide(true);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setTimeout(() => {
          setButtonHide(false);
        }, 100);
      });
    };
  }, []);

  // Functions

  const onChangeText = value => {
    setText(value);
  };
  const onSubmitEditing = async () => {
    if (!text || text.length < 1) {
      setSearch(false);
      if (allNotes) {
        setNotes(allNotes);
      } else {
        fetchNotes();
      }
    } else {
      setSearch(true);
      setKeyword(text);
      searchResults = await db.searchNotes(text);
      if (searchResults) {
        setNotes(searchResults);
      }
    }
  };

  const onBlur = () => {
    if (text && text.length < 2) {
      setSearch(false);
      if (allNotes) {
        setNotes(allNotes);
      } else {
        fetchNotes();
      }
    }
  };

  const onFocus = () => {
    setSearch(false);
  };

  const clearSearch = () => {
    searchResults = null;
    setSearch(false);
    if (allNotes) {
      setNotes(allNotes);
    } else {
      fetchNotes();
    }
  };

  const setMarginTop = () => {
    return;
    if (headerHeight < 30 || searchHeight < 30) {
      return;
    }
    let toAdd = h * 0.06;
    if (marginSet) return;
    let a = headerHeight + searchHeight + toAdd;
    setMargin(a);
    headerHeight = 0;
    searchHeight = 0;
    marginSet = true;
  };

  // Render

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        backgroundColor: colors.night ? colors.bg : colors.bg,
      }}>
      <KeyboardAvoidingView
        style={{
          height: '100%',
        }}>
        <NavigationEvents
          onWillFocus={() => {
            setUpdate(update + 1);
          }}
        />
        <Animatable.View
          transition="backgroundColor"
          duration={300}
          style={{
            position: 'absolute',
            backgroundColor: colors.night ? colors.bg : colors.bg,
            zIndex: 10,
            width: '100%',
          }}>
          <Header
            sendHeight={height => {
              headerHeight = height;
              setMarginTop();
            }}
            menu={true}
            hide={hideHeader}
            showSearch={() => {
              setHideHeader(false);
              countUp = 0;
              countDown = 0;
            }}
            colors={colors}
            heading="Home"
            canGoBack={false}
            customIcon="menu"
          />

          <Search
            sendHeight={height => {
              searchHeight = height;
              setMarginTop();
            }}
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
        </Animatable.View>

        <NotesList
          margin={margin}
          numOfColumns={DDS.isTab ? 2 : 1}
          onScroll={y => {
            if (buttonHide) return;
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
          }}
          isSearch={search}
          notes={notes}
          keyword={keyword}
        />

        {buttonHide ? null : (
          <TouchableOpacity
            onPress={() => {
              SideMenuEvent.close();
              SideMenuEvent.disable();
              NavigationService.navigate('Editor');
            }}
            activeOpacity={opacity}
            style={{
              width: DDS.isTab ? '95%' : '90%',
              alignSelf: 'center',
              borderRadius: br,
              backgroundColor: colors.accent,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
            <View
              style={{
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
                width: '100%',
                padding: pv,
                paddingVertical: pv + 5,
              }}>
              <Icon name="plus" color="white" size={SIZE.lg} />
              <Text
                style={{
                  fontSize: SIZE.md,
                  color: 'white',
                  fontFamily: WEIGHT.regular,
                  textAlignVertical: 'center',
                }}>
                {'  '}Add a new note
              </Text>
            </View>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </AnimatedSafeAreaView>
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
