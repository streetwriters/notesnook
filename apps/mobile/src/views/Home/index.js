import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  SafeAreaView,
  Platform,
} from 'react-native';
import NavigationService from '../../services/NavigationService';
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

import Icon from 'react-native-vector-icons/Ionicons';
import {Search} from '../../components/SearchInput';
import {Reminder} from '../../components/Reminder';
import {RecentList} from '../../components/Recents';
import {getElevation} from '../../utils/utils';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Home = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);

  const RenderMenu = (
    <SafeAreaView
      style={{
        height: '100%',
        backgroundColor: colors.accent,
      }}>
      <View
        style={{
          height: '25%',
          width: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          alignSelf: 'center',
        }}>
        <Image
          style={{
            width: 80,
            height: 80,
            borderRadius: 100,
          }}
          source={require('../../assets/images/img.png')}
        />
        <Text
          style={{
            fontFamily: WEIGHT.regular,
            color: 'white',
            fontSize: SIZE.md,
            marginTop: 10,
          }}>
          Hi, Ammar!
        </Text>

        <Text
          style={{
            fontFamily: WEIGHT.regular,
            color: 'white',
            fontSize: SIZE.xs,
            marginTop: 10,
          }}>
          Usage: 80.45/100 MB
        </Text>

        <View
          style={{
            borderRadius: 2.5,
            backgroundColor: 'white',
            ...getElevation(10),
            marginTop: 10,
            paddingHorizontal: 5,
            paddingVertical: 2,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.regular,

              fontSize: SIZE.xxs,
            }}>
            Basic User
          </Text>
        </View>
      </View>

      <View
        style={{
          ...getElevation(5),
          backgroundColor: 'white',
          width: '90%',
          alignSelf: 'center',
          height: '60%',
          marginVertical: 10,
          borderRadius: 5,
        }}>
        <View
          style={{
            backgroundColor: 'white',
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: ph,
            marginVertical: 10,
          }}>
          <Icon
            style={{
              width: 30,
            }}
            name="ios-home"
            color={colors.icon}
            size={SIZE.lg}
          />
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              fontSize: SIZE.sm,
              marginTop: -5,
            }}>
            Home
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'white',
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: ph,
            marginVertical: 10,
          }}>
          <Icon
            style={{
              width: 30,
            }}
            name="ios-heart"
            color={colors.icon}
            size={SIZE.lg}
          />
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              fontSize: SIZE.sm,
              marginTop: -5,
            }}>
            Favourites
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'white',
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: ph,
            marginVertical: 10,
          }}>
          <Icon
            style={{
              width: 30,
            }}
            name="ios-settings"
            color={colors.icon}
            size={SIZE.lg}
          />
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              fontSize: SIZE.sm,
              marginTop: -5,
            }}>
            Settings
          </Text>
        </View>
        <View
          style={{
            backgroundColor: 'white',
            width: '100%',
            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            alignItems: 'center',
            paddingHorizontal: ph,
            marginVertical: 10,
          }}>
          <Icon
            style={{
              width: 30,
            }}
            name="ios-sync"
            color={colors.icon}
            size={SIZE.lg}
          />
          <Text
            style={{
              fontFamily: WEIGHT.medium,
              fontSize: SIZE.sm,
              marginTop: -5,
            }}>
            Sync
          </Text>
        </View>
      </View>

      <View
        style={{
          ...getElevation(5),
          backgroundColor: '#F3A712',

          width: '90%',
          alignSelf: 'center',
          borderRadius: 5,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '5%',
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
          <Icon name="ios-star" color="#FCBA04" size={SIZE.lg} />
        </View>
      </View>
    </SafeAreaView>
  );

  let data = [
    {
      name: '',
      icon: 'md-add',
      func: () => {
        NavigationService.navigate('Editor');
      },
    },
    {
      name: 'Reminders',
      icon: 'ios-clock',
      func: () => {},
    },
    {
      name: 'Lists',
      icon: 'ios-list',
      func: () => {},
    },
  ];

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  });

  return (
    <SideMenu menu={RenderMenu} openMenuOffset={w / 1.5}>
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: '5%',
            marginTop: Platform.OS == 'ios' ? h * 0.02 : '7.5%',
            marginBottom: h * 0.02,
          }}>
          <Text
            style={{
              fontSize: SIZE.xxl,
              color: colors.pri,
              fontFamily: WEIGHT.bold,
            }}>
            Notes
          </Text>
          <Icon name="md-more" color={colors.icon} size={SIZE.xxxl} />
        </View>

        <Search />

        <ScrollView
          horizontal={true}
          style={{
            paddingHorizontal: '4%',
            height: 200,
          }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'row',
          }}>
          {data.map(item => (
            <TouchableOpacity
              onPress={item.func}
              activeOpacity={opacity}
              style={{
                ...getElevation(5),
                width: 100,
                height: 100,
                borderRadius: br,
                backgroundColor:
                  item.icon === 'md-add' ? colors.accent : '#f0f0f0',
                justifyContent: 'center',
                alignItems: 'center',

                marginRight: 30,
                marginLeft: 5,
              }}>
              <View
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Icon
                  name={item.icon}
                  color={item.icon === 'md-add' ? 'white' : colors.icon}
                  size={SIZE.xxl}
                />
                {item.name !== '' ? (
                  <Text
                    style={{
                      fontSize: SIZE.sm - 2,
                      color: colors.icon,
                      fontFamily: WEIGHT.regular,
                    }}>
                    {item.name}
                  </Text>
                ) : (
                  undefined
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Reminder />

        <RecentList />
      </SafeAreaView>
    </SideMenu>
  );
};

Home.navigationOptions = {
  header: null,
};

export default Home;
