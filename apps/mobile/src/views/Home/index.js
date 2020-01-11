import React, {useEffect, useState} from 'react';
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
import {w, h, SideMenuEvent, getElevation, ToastEvent} from '../../utils/utils';
import {Header} from '../../components/header';
import {NotesList} from '../../components/NotesList';
import {db} from '../../../App';
import Icon from 'react-native-vector-icons/Feather';
import NavigationService from '../../services/NavigationService';
import * as Animatable from 'react-native-animatable';
import {useIsFocused} from 'react-navigation-hooks';
import {useAppContext} from '../../provider/useAppContext';
import {DDS} from '../../../App';
export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const Home = ({navigation}) => {
  // State
  const {
    colors,
    updateAppTheme,
    setMenuOpen,
    selectionMode,
    selectedItemsList,
    changeSelectionMode,
    updateSelectionList,
  } = useAppContext();

  const [search, setSearch] = useState(false);
  const [text, setText] = useState('');
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(180);
  const [buttonHide, setButtonHide] = useState(false);
  const [notes, setNotes] = useState([]);
  const [keyword, setKeyword] = useState('');
  const isFocused = useIsFocused();

  // Variables
  let offsetY = 0;
  let countUp = 1;
  let countDown = 0;
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
    allNotes = db.groupNotes();
    setNotes([...allNotes]);
    console.log(allNotes);
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

      fetchNotes();
    } else {
      setKeyword(text);
      searchResults = await db.searchNotes(text);
      console.log(searchResults, 'hello');
      if (searchResults && searchResults.length > 0) {
        setNotes([...[]]);
        setSearch(true);
        setNotes([...searchResults]);
      } else {
        ToastEvent.show('No search results found', 'error', 3000, () => {}, '');
      }
    }
  };

  const onBlur = () => {
    if (text && text.length < 2) {
      setSearch(false);
      fetchNotes();
    }
  };

  const onFocus = () => {
    setSearch(false);
  };

  const clearSearch = () => {
    searchResults = null;
    setSearch(false);

    fetchNotes();
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
        <Animatable.View
          transition={['backgroundColor', 'opacity', 'height']}
          duration={300}
          style={{
            width: '100%',
            position: 'absolute',
            height: selectionMode ? 50 : 0,
            opacity: selectionMode ? 1 : 0,
            justifyContent: 'flex-end',
            zIndex: 11,
          }}>
          <View
            style={{
              width: w - 24,
              marginHorizontal: 12,
              height: 50,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
            <View
              style={{
                justifyContent: 'space-between',
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <TouchableOpacity
                onPress={() => {
                  changeSelectionMode(false);
                }}
                hitSlop={{top: 20, bottom: 20, left: 50, right: 40}}
                style={{
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  height: 40,
                  width: 50,
                  marginTop: 2.5,
                }}>
                <Icon
                  style={{
                    marginLeft: -5,
                  }}
                  color={colors.pri}
                  name={'chevron-left'}
                  size={SIZE.xxxl - 3}
                />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: SIZE.lg,
                  fontFamily: WEIGHT.regular,
                  color: colors.pri,
                  textAlignVertical: 'center',
                }}>
                {selectedItemsList.length}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
              <Icon
                style={{
                  paddingLeft: 25,
                }}
                color={colors.accent}
                name={'plus'}
                size={SIZE.xl}
              />
              <Icon
                style={{
                  paddingLeft: 25,
                }}
                color={colors.accent}
                name={'star'}
                size={SIZE.xl - 3}
              />

              <Icon
                style={{
                  paddingLeft: 25,
                }}
                color={colors.errorText}
                name={'trash'}
                size={SIZE.xl - 3}
              />
            </View>
          </View>
        </Animatable.View>

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
            heading="Home"
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
          margin={margin}
          isGrouped={true}
          refresh={() => {
            fetchNotes();
          }}
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
              width: '95%',
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
