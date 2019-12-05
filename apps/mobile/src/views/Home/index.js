import React, {useEffect, useState, createRef} from 'react';
import {
  SafeAreaView,
  Platform,
  DeviceEventEmitter,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Text,
} from 'react-native';
import {COLOR_SCHEME, opacity, pv, br, SIZE, WEIGHT} from '../../common/common';
import {styles} from './styles';
import {Search} from '../../components/SearchInput';
import {RecentList} from '../../components/Recents';
import {w} from '../../utils/utils';
import {Header} from '../../components/header';
import {NavigationEvents} from 'react-navigation';
import {NotesList} from '../../components/NotesList';
import {storage} from '../../../App';
import Icon from 'react-native-vector-icons/Feather';
import NavigationService from '../../services/NavigationService';
export const Home = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [hidden, setHidden] = useState(false);
  const [text, setText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [update, setUpdate] = useState(0);
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

  return Platform.isPad ? (
    <SafeAreaView style={[styles.container]}>
      <KeyboardAvoidingView>
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

        <Header
          colors={colors}
          heading="Home"
          canGoBack={false}
          customIcon="menu"
        />

        <Search
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onBlur={onBlur}
          onFocus={onFocus}
          clearSearch={clearSearch}
          value={text}
        />

        {hidden ? (
          <NotesList searchResults={searchResults} keyword={text} />
        ) : (
          <RecentList update={update} />
        )}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

Home.navigationOptions = {
  header: null,
};

export default Home;
