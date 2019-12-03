import React, {useEffect, useState, createRef} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
  FlatList,
  DeviceEventEmitter,
} from 'react-native';
import NavigationService, {HomeNav} from '../../services/NavigationService';
import {
  COLOR_SCHEME,
  SIZE,
  br,
  ph,
  pv,
  opacity,
  FONT,
  WEIGHT,
} from '../../common/common';
import SideMenu from 'react-native-side-menu';
import {styles} from './styles';

import Icon from 'react-native-vector-icons/Feather';
import {Search} from '../../components/SearchInput';
import {Reminder} from '../../components/Reminder';
import {RecentList} from '../../components/Recents';
import {getElevation, w, h} from '../../utils/utils';
import {Header} from '../../components/header';
import {tsPropertySignature} from '@babel/types';
import {NavigationEvents} from 'react-navigation';
import {NotesList} from '../../components/NotesList';
import {storage} from '../../../App';

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
      menu={<RenderSideMenu colors={colors} close={() => setOpen(false)} />}
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

export const RenderSideMenu = ({colors, close}) => (
  <SafeAreaView
    style={{
      height: '100%',

      backgroundColor: colors.navbg,
    }}>
    <ScrollView
      contentContainerStyle={{
        justifyContent: 'space-between',
        height: '100%',
      }}>
      <View>
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.navbg,
            height: 2,
            backgroundColor: colors.navbg,
            width: '100%',
            marginBottom: 5,
            marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.03,
          }}
        />
        <FlatList
          data={[
            {
              name: 'Home',
              icon: 'home',
              func: () => NavigationService.navigate('Home'),
            },

            {
              name: 'Notebooks',
              icon: 'book',
              func: () => NavigationService.navigate('Folders'),
            },
            {
              name: 'Lists',
              icon: 'list',
              func: () => NavigationService.navigate('Lists'),
            },
            {
              name: 'Favorites',
              icon: 'star',
              func: () => NavigationService.navigate('Favorites'),
            },

            {
              name: 'Dark Mode',
              icon: 'moon',
              func: () => NavigationService.navigate('Folders'),
              switch: true,
              on: false,
            },
            {
              name: 'Trash',
              icon: 'trash',
              func: () => NavigationService.navigate('Trash'),
            },
            {
              name: 'Settings',
              icon: 'settings',
              func: () => NavigationService.navigate('Settings'),
            },
          ]}
          keyExtractor={(item, index) => item.name}
          renderItem={({item, index}) => (
            <TouchableOpacity
              activeOpacity={opacity}
              onPress={() => {
                item.func();
              }}
              style={{
                width: '100%',
                alignSelf: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: ph,
                paddingVertical: 15,
              }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                }}>
                <Icon
                  style={{
                    width: 30,
                  }}
                  name={item.icon}
                  color={colors.icon}
                  size={SIZE.md}
                />
                <Text
                  style={{
                    fontFamily: WEIGHT.medium,
                    fontSize: SIZE.sm - 1,
                  }}>
                  {item.name}
                </Text>
              </View>
              {item.switch ? (
                <Icon
                  size={SIZE.lg}
                  color={item.on ? colors.accent : colors.icon}
                  name={item.on ? 'toggle-right' : 'toggle-left'}
                />
              ) : (
                undefined
              )}
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity
          onPress={() => {
            close();
            NavigationService.navigate('Tags');
          }}
          style={{
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: ph,
            marginTop: 15,
          }}>
          <Icon
            style={{
              width: 30,
            }}
            name="tag"
            color={colors.icon}
            size={SIZE.md}
          />
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              fontSize: SIZE.sm - 1,
            }}>
            Tags
          </Text>
        </TouchableOpacity>

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.navbg,
            height: 2,
            backgroundColor: colors.navbg,
            width: '100%',
            marginBottom: 5,
          }}
        />
        <ScrollView
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: '5%',
            marginBottom: 0,
          }}>
          {[
            'home',
            'office',
            'work',
            'book_notes',
            'poem',
            'lists',
            'water',
          ].map(item => (
            <TouchableOpacity
              onPress={() => {
                close();
                NavigationService.navigate('Notes', {
                  heading: item,
                });
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                margin: 5,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm - 2,
                  color: colors.icon,
                }}>
                #{item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View
          style={{
            borderWidth: 1,
            borderColor: colors.navbg,
            height: 2,
            backgroundColor: colors.navbg,
            width: '100%',
            marginBottom: 5,
          }}
        />
        <ScrollView
          contentContainerStyle={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            paddingHorizontal: '5%',
            marginBottom: 15,
          }}>
          {['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'gray'].map(
            item => (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                  margin: 5,
                }}>
                <View
                  style={{
                    width: 25,
                    height: 25,
                    backgroundColor: item,
                    borderRadius: 100,
                  }}
                />
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
      </View>

      {/*  <View
          style={{
            backgroundColor: '#F3A712',
            width: '90%',
            alignSelf: 'center',
            borderRadius: 5,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: 40,
            paddingHorizontal: ph,
            marginVertical: 10,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              color: 'white',
            }}>
            Upgrade to Pro
          </Text>

          <View
            style={{
              ...getElevation(5),
              paddingHorizontal: ph,
              backgroundColor: 'white',
              paddingVertical: pv - 8,
              borderRadius: 5,
            }}>
            <Icon name="star" color="#FCBA04" size={SIZE.lg} />
          </View>
        </View> */}

      <View
        style={{
          width: '100%',
          justifyContent: 'space-between',
          paddingHorizontal: '5%',
          alignItems: 'center',
          alignSelf: 'center',
          marginBottom: 20,
          flexDirection: 'row',
        }}>
        <TouchableOpacity
          onPress={() => {
            close();

            NavigationService.navigate('Login');
          }}
          activeOpacity={opacity}
          style={{
            paddingVertical: pv,
            paddingHorizontal: ph,
            borderRadius: 5,
            width: '100%',
            justifyContent: 'center',
            alignItems: 'center',
            borderColor: colors.accent,
            backgroundColor: colors.accent,
            borderWidth: 1,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              color: 'white',
              fontSize: SIZE.sm,
            }}>
            Login to Sync
          </Text>
        </TouchableOpacity>

        {/* <Text
        style={{
          fontFamily: WEIGHT.semibold,
          color: colors.accent,
          fontSize: SIZE.md,
          marginTop: 10,
        }}>
        Hi, Ammar!
      </Text>

      <Text
        style={{
          fontFamily: WEIGHT.regular,
          color: colors.accent,
          fontSize: SIZE.xs,
          marginTop: 10,
        }}>
        80.45/100 MB
      </Text> */}

        {/*  <View
        style={{
          borderRadius: 2.5,
          backgroundColor: colors.accent,
          marginTop: 10,
          paddingHorizontal: 5,
          paddingVertical: 2,
        }}>
        <Text
          style={{
            fontFamily: WEIGHT.bold,
            fontSize: SIZE.xxs,
            color: 'white',
          }}>
          Basic User
        </Text>
      </View> */}
      </View>
    </ScrollView>
  </SafeAreaView>
);
