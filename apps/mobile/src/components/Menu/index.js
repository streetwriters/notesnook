import React from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Platform,
  FlatList,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
import {
  SIZE,
  pv,
  opacity,
  WEIGHT,
  COLOR_SCHEME_DARK,
  COLOR_SCHEME_LIGHT,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {h} from '../../utils/utils';
import AsyncStorage from '@react-native-community/async-storage';
import {AnimatedSafeAreaView} from '../../views/Home';
import {useAppContext} from '../../provider/useAppContext';

export const Menu = ({close = () => {}, hide, update = () => {}}) => {
  const {colors, changeColorScheme} = useAppContext();

  return (
    <AnimatedSafeAreaView
      transition="backgroundColor"
      duration={300}
      style={{
        height: '100%',
        opacity: hide ? 0 : 1,
        backgroundColor: colors.shade,
      }}>
      <View
        style={{
          height: 2,
          width: '100%',
          marginBottom: 5,
          marginTop: Platform.OS == 'ios' ? 0 : 45,
        }}
      />

      <ScrollView
        contentContainerStyle={{
          justifyContent: 'space-between',
          height: '100%',
        }}>
        <View>
          <FlatList
            data={[
              {
                name: 'Home',
                icon: 'home',
                func: () => NavigationService.push('Home'),
                close: true,
              },

              {
                name: 'Notebooks',
                icon: 'book',
                func: () =>
                  NavigationService.push('Folders', {
                    title: 'Notebooks',
                  }),
                close: true,
              },
              {
                name: 'Lists',
                icon: 'list',
                func: () => NavigationService.push('Lists'),
                close: true,
              },
              {
                name: 'Favorites',
                icon: 'star',
                func: () => NavigationService.push('Favorites'),
                close: true,
              },

              {
                name: 'Dark Mode',
                icon: 'moon',
                func: () => {
                  if (!colors.night) {
                    AsyncStorage.setItem(
                      'theme',
                      JSON.stringify(COLOR_SCHEME_DARK),
                    );
                    changeColorScheme(COLOR_SCHEME_DARK);
                  } else {
                    AsyncStorage.setItem(
                      'theme',
                      JSON.stringify(COLOR_SCHEME_LIGHT),
                    );

                    changeColorScheme(COLOR_SCHEME_LIGHT);
                  }
                },
                switch: true,
                on: colors.night ? true : false,
                close: false,
              },
              {
                name: 'Trash',
                icon: 'trash',
                func: () => NavigationService.push('Trash'),
                close: true,
              },
              {
                name: 'Settings',
                icon: 'settings',
                func: () => NavigationService.push('Settings'),
                close: true,
              },
            ]}
            keyExtractor={(item, index) => item.name}
            renderItem={({item, index}) => (
              <TouchableOpacity
                activeOpacity={opacity}
                onPress={() => {
                  item.close === false ? null : close();

                  item.func();
                }}
                style={{
                  width: '100%',
                  alignSelf: 'center',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingHorizontal: '5%',
                  paddingVertical: pv + 5,
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
                    color={colors.pri}
                    size={SIZE.md}
                  />
                  <Text
                    style={{
                      fontFamily: WEIGHT.regular,
                      fontSize: SIZE.sm,
                      color: colors.pri,
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
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingHorizontal: '5%',
              marginTop: 15,
            }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
              }}>
              <Icon
                style={{
                  width: 30,
                }}
                name="tag"
                color={colors.pri}
                size={SIZE.md}
              />
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                  color: colors.pri,
                }}>
                Tags
              </Text>
            </View>
          </TouchableOpacity>

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
                  padding: 7,
                  paddingLeft: 3.5,
                }}>
                <Text
                  style={{
                    fontFamily: WEIGHT.regular,
                    fontSize: SIZE.xs + 1,
                    color: colors.icon,
                  }}>
                  #{item}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
                      width: 35,
                      height: 35,
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
              paddingVertical: pv + 5,

              width: '100%',
              borderRadius: 5,
              justifyContent: 'flex-start',
              alignItems: 'center',
              flexDirection: 'row',
            }}>
            <Icon name="log-in" color={colors.accent} size={SIZE.lg} />

            <Text
              style={{
                fontFamily: WEIGHT.regular,
                color: colors.accent,
                fontSize: SIZE.md,
              }}>
              {'  '}Login
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
    </AnimatedSafeAreaView>
  );
};
