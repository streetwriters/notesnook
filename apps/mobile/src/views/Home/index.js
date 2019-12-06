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
import {COLOR_SCHEME, opacity, pv, br, SIZE, WEIGHT} from '../../common/common';
import {styles} from './styles';
import {Search} from '../../components/SearchInput';
import {RecentList} from '../../components/Recents';
import {w, h} from '../../utils/utils';
import {Header} from '../../components/header';
import {NavigationEvents} from 'react-navigation';
import {NotesList} from '../../components/NotesList';
import {storage} from '../../../App';
import Icon from 'react-native-vector-icons/Feather';
import NavigationService from '../../services/NavigationService';
import {ScrollView} from 'react-native-gesture-handler';
export const Home = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [hidden, setHidden] = useState(false);
  const [text, setText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [update, setUpdate] = useState(0);
  const [hideHeader, setHideHeader] = useState(false);
  const [margin, setMargin] = useState(150);
  const [buttonHide, setButtonHide] = useState(false);
  let offsetY = 0;
  let countUp = 0;
  let countDown = 0;
  let headerHeight = 0;
  let searchHeight = 0;

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const onChangeText = value => {
    setText(value);
  };
  const onSubmitEditing = async () => {
    if (!text || text.length < 1) {
      setHidden(false);
    } else {
      setHidden(true);
      let results = await storage.searchNotes(text);
      if (results) {
        setSearchResults(results);
      }
    }
  };

  const onBlur = () => {
    if (text && text.length < 2) {
      setHidden(false);
    }
  };

  const onFocus = () => {
    setHidden(false);
  };

  const clearSearch = () => {
    setSearchResults([]);
    setHidden(false);
  };

  const setMarginTop = () => {
    if (margin !== 150) return;
    if (headerHeight == 0 || searchHeight == 0) {
      let toAdd = h * 0.06;

      setTimeout(() => {
        if (margin > headerHeight + searchHeight + toAdd) return;
        setMargin(headerHeight + searchHeight + toAdd);
        headerHeight = 0;
        searchHeight = 0;
      }, 10);
    }
  };
  useEffect(() => {
    Keyboard.addListener('keyboardDidShow', () => {
      setButtonHide(true);
    });
    Keyboard.addListener('keyboardDidHide', () => {
      setTimeout(() => {
        setButtonHide(false);
      }, 600);
    });
    return () => {
      Keyboard.removeListener('keyboardDidShow', () => {
        setButtonHide(true);
      });
      Keyboard.removeListener('keyboardDidHide', () => {
        setTimeout(() => {
          setButtonHide(false);
        }, 600);
      });
    };
  }, []);

  return Platform.isPad ? (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.bg}]}>
      <KeyboardAvoidingView style={{backgroundColor: colors.bg}}>
        <NavigationEvents
          onWillFocus={() => {
            DeviceEventEmitter.emit('openSidebar');
            setUpdate(update + 1);
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
    <SafeAreaView
      style={{
        height: '100%',
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
        <View
          style={{
            position: 'absolute',
            backgroundColor: colors.bg,
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
        </View>
        {hidden ? (
          <NotesList
            margin={margin}
            onScroll={y => {
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
            searchResults={searchResults}
            keyword={text}
          />
        ) : (
          <RecentList
            onScroll={y => {
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
            margin={margin}
            update={update}
          />
        )}
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
                }}>
                Add a new note
              </Text>
              <Icon name="plus" color="white" size={SIZE.lg} />
            </View>
          </TouchableOpacity>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

Home.navigationOptions = {
  header: null,
};

export default Home;
