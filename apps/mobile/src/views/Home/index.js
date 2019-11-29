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

export const Home = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [isOpen, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  let text = null;

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const onChangeText = value => {
    text = value;
    if (value.length > 2) {
      setHidden(true);
    }
  };
  const onSubmitEditing = () => {
    if (!text || text.length < 2) {
      setHidden(false);
    }
  };

  const onBlur = () => {
    if (text && text.length < 2) {
      setHidden(false);
    }
  };

  const onFocus = () => {};

  return Platform.isPad ? (
    <SafeAreaView style={[styles.container]}>
      <NavigationEvents
        onWillFocus={() => {
          DeviceEventEmitter.emit('openSidebar');
        }}
      />
      <Header colors={colors} heading="Home" canGoBack={false} />

      <Search
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        onBlur={onBlur}
        onFocus={onFocus}
      />

      {hidden ? null : <RecentList />}
    </SafeAreaView>
  ) : (
    <SideMenu
      isOpen={isOpen}
      bounceBackOnOverdraw={false}
      onChange={args => {
        setOpen(args);
      }}
      menu={RenderSideMenu(colors, () => setOpen(false))}
      openMenuOffset={w / 1.5}>
      <SafeAreaView style={styles.container}>
        <Header colors={colors} heading="Home" canGoBack={false} />

        <Search
          onChangeText={onChangeText}
          onSubmitEditing={onSubmitEditing}
          onBlur={onBlur}
          onFocus={onFocus}
        />

        {hidden ? null : <RecentList />}
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
      justifyContent: 'space-between',
    }}>
    <View>
      <View
        style={{
          width: '100%',
          justifyContent: 'space-between',
          paddingHorizontal: '5%',
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: 'white',
          marginBottom: 10,
          marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.04,
          flexDirection: 'row',
        }}>
        <Image
          style={{
            width: 35,
            height: 35,
            borderRadius: 100,
            marginRight: 10,
          }}
          source={require('../../assets/images/img.png')}
        />

        <TouchableOpacity
          onPress={() => {
            close();

            NavigationService.navigate('Login');
          }}
          activeOpacity={opacity}
          style={{
            paddingVertical: pv - 5,
            paddingHorizontal: ph,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
            borderColor: colors.accent,
            backgroundColor: colors.bg,
            borderWidth: 1,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              color: colors.accent,
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
            func: () => NavigationService.navigate('Favorites'),
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
            func: () => NavigationService.navigate('Folders'),
          },
          {
            name: 'Settings',
            icon: 'settings',
            func: () => NavigationService.navigate('Folders'),
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
              paddingVertical: 10,
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
                size={SIZE.lg}
              />
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  fontSize: SIZE.sm,
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
    </View>

    <View>
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: ph,
          marginTop: 20,
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
            fontSize: SIZE.sm,
            marginTop: -5,
          }}>
          Tags
        </Text>
      </View>

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
          marginBottom: 20,
        }}>
        {['home', 'office', 'work', 'book_notes', 'poem', 'lists', 'water'].map(
          item => (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                margin: 5,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  fontSize: SIZE.sm,
                  color: colors.icon,
                }}>
                #{item}
              </Text>
            </TouchableOpacity>
          ),
        )}
      </ScrollView>

      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          paddingHorizontal: ph,
          marginTop: 20,
        }}>
        <Icon
          style={{
            width: 30,
          }}
          name="circle"
          color={colors.icon}
          size={SIZE.md}
        />
        <Text
          style={{
            fontFamily: WEIGHT.medium,
            fontSize: SIZE.sm,
            marginTop: -5,
          }}>
          Colors
        </Text>
      </View>
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
          marginBottom: 40,
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
                  width: 40,
                  height: 25,
                  backgroundColor: item,
                  borderRadius: 5,
                }}
              />
            </TouchableOpacity>
          ),
        )}
      </ScrollView>

      <View
        style={{
          backgroundColor: '#F3A712',
          width: '95%',
          alignSelf: 'center',
          borderRadius: 5,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: h * 0.05,
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
      </View>
    </View>
  </SafeAreaView>
);
