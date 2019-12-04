import React, {useEffect, useState, createRef} from 'react';
import {SafeAreaView, Platform, DeviceEventEmitter} from 'react-native';
import {COLOR_SCHEME} from '../../common/common';
import SideMenu from 'react-native-side-menu';
import {styles} from './styles';
import {Search} from '../../components/SearchInput';
import {RecentList} from '../../components/Recents';
import {w} from '../../utils/utils';
import {Header} from '../../components/header';
import {NavigationEvents} from 'react-navigation';
import {NotesList} from '../../components/NotesList';
import {storage} from '../../../App';
import {Menu} from '../../components/Menu';

export const Home = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [isOpen, setOpen] = useState(false);
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

  const onFocus = () => {};

  const clearSearch = () => {
    setSearchResults([]);
    setHidden(false);
  };

  return Platform.isPad ? (
    <SafeAreaView style={[styles.container]}>
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
    </SafeAreaView>
  ) : (
    <SideMenu
      isOpen={isOpen}
      bounceBackOnOverdraw={false}
      onChange={args => {
        setOpen(args);
      }}
      menu={<Menu colors={colors} close={() => setOpen(false)} />}
      openMenuOffset={w / 1.5}>
      <SafeAreaView style={styles.container}>
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
      </SafeAreaView>
    </SideMenu>
  );
};

Home.navigationOptions = {
  header: null,
};

export default Home;
