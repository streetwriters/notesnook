import React, {useEffect, useState, createRef} from 'react';
import {
  SafeAreaView,
  Platform,
  DeviceEventEmitter,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Text,
  Keyboard,
} from 'react-native';
import {
  COLOR_SCHEME,
  opacity,
  pv,
  br,
  SIZE,
  WEIGHT,
  onThemeUpdate,
  clearThemeUpdateListener,
} from '../../common/common';
import {styles} from './styles';
import {Search} from '../../components/SearchInput';
import {w, h} from '../../utils/utils';
import {Header} from '../../components/header';
import {NavigationEvents} from 'react-navigation';
import {NotesList} from '../../components/NotesList';
import {storage} from '../../../App';
import Icon from 'react-native-vector-icons/Feather';
import NavigationService from '../../services/NavigationService';
import {useForceUpdate} from '../ListsEditor';
import * as Animatable from 'react-native-animatable';

export const AnimatedSafeAreaView = Animatable.createAnimatableComponent(
  SafeAreaView,
);

export const Home = ({navigation}) => {
  // State
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [search, setSearch] = useState(false);
  const [text, setText] = useState('');
  const [update, setUpdate] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(150);
  const [buttonHide, setButtonHide] = useState(false);
  const [notes, setNotes] = useState([]);
  const [keyword, setKeyword] = useState('');
  const forceUpdate = useForceUpdate();

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
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    onThemeUpdate(() => {
      forceUpdate();
    });
    return () => {
      clearThemeUpdateListener(() => {
        forceUpdate();
      });
    };
  }, []);

  useEffect(() => {
    fetchNotes();
  }, []);

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
      searchResults = await storage.searchNotes(text);
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
    if (margin !== 150) return;
    if (headerHeight == 0 || searchHeight == 0) {
      let toAdd = h * 0.06;

      setTimeout(() => {
        if (marginSet) return;
        setMargin(headerHeight + searchHeight + toAdd);
        headerHeight = 0;
        searchHeight = 0;
        marginSet = true;
      }, 10);
    }
  };

  const fetchNotes = async () => {
    allNotes = await storage.getNotes();
    if (allNotes) {
      setNotes(allNotes);
    }
  };

  // Render

  return Platform.isPad ? (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.bg}]}>
      <KeyboardAvoidingView style={{backgroundColor: colors.bg}}>
        <NavigationEvents
          onWillFocus={() => {
            DeviceEventEmitter.emit('openSidebar');
            setUpdate(update + 1);
          }}
          onDidBlur={() => {
            marginSet = false;
          }}
        />

        <Header colors={colors} heading="Home" canGoBack={false} />

        <Search
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onBlur={onBlur}
          onFocus={onFocus}
          value={text}
          onClose={() => {
            setHidden(false);
            setText('');
          }}
        />

        {hidden ? <NotesList keyword={text} /> : <RecentList />}
      </KeyboardAvoidingView>
    </SafeAreaView>
  ) : (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={1000}
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
          duration={1000}
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
              NavigationService.navigate('Editor');
            }}
            activeOpacity={opacity}
            style={{
              width: '90%',
              alignSelf: 'center',
              borderRadius: br,
              backgroundColor: colors.accent,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 20,
            }}>
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'center',
                flexDirection: 'row',
                width: '100%',
                padding: pv,
                paddingVertical: pv + 5,
              }}>
              <Text
                style={{
                  fontSize: SIZE.md,
                  color: 'white',
                  fontFamily: WEIGHT.bold,
                  textAlignVertical: 'center',
                }}>
                <Icon name="plus" color="white" size={SIZE.lg} />
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
};

export default Home;
