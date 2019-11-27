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
  const [isOpen, setOpen] = useState(false);
  const RenderSideMenu = (
    <SafeAreaView
      style={{
        height: '100%',
        justifyContent: 'center',
      }}>
      <View
        style={{
          width: '100%',
          justifyContent: 'flex-start',
          paddingHorizontal: '5%',
          alignItems: 'center',
          alignSelf: 'center',
          backgroundColor: 'white',
          marginBottom: 20,
        }}>
        <Image
          style={{
            width: 80,
            height: 80,
            borderRadius: 100,
            marginRight: 10,
          }}
          source={require('../../assets/images/img.png')}
        />

        <TouchableOpacity
          onPress={() => {
            NavigationService.navigate('Login');
          }}
          activeOpacity={opacity}
          style={{
            paddingVertical: pv - 5,
            paddingHorizontal: ph,
            borderRadius: 5,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 20,
            borderColor: colors.accent,
            backgroundColor: colors.bg,
            borderWidth: 1,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              color: colors.accent,
            }}>
            Log in to Sync
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
          width: '100%',
          alignSelf: 'center',
          height: '60%',
          marginVertical: 10,
          borderRadius: 5,
        }}>
        <FlatList
          data={[
            {
              name: 'Home',
              icon: 'ios-home',
              func: () => NavigationService.navigate('Home'),
            },
            {
              name: 'Favorites',
              icon: 'md-star',
              func: () => NavigationService.navigate('Favorites'),
            },
            {
              name: 'Notebooks',
              icon: 'md-folder',
              func: () => NavigationService.navigate('Folders'),
            },
            {
              name: 'Tags',
              icon: 'md-folder',
              func: () => {},
            },
            {
              name: 'Colors',
              icon: 'md-folder',
              func: () => {},
            },
          ]}
          keyExtractor={(item, index) => item.name}
          renderItem={({item, index}) => (
            <TouchableOpacity
              activeOpacity={opacity}
              onPress={() => {
                item.func();
                setOpen(false);
              }}
              style={{
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
                name={item.icon}
                color={colors.icon}
                size={SIZE.lg}
              />
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  fontSize: SIZE.sm,
                  marginTop: -5,
                }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View
        style={{
          backgroundColor: '#F3A712',
          width: '95%',
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

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  });

  return (
    <SideMenu
      isOpen={isOpen}
      bounceBackOnOverdraw={false}
      onChange={args => {
        setOpen(args);
      }}
      menu={RenderSideMenu}
      openMenuOffset={w / 1.5}>
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: '5%',
            marginTop: Platform.OS == 'ios' ? h * 0.01 : h * 0.04,
            marginBottom: h * 0.04,
          }}>
          <Text
            style={{
              fontSize: SIZE.xxl,
              color: colors.pri,
              fontFamily: WEIGHT.bold,
            }}>
            Notes
          </Text>
          <Icon name="md-more" color={colors.icon} size={SIZE.xxl} />
        </View>

        <Search />
        <RecentList />
      </SafeAreaView>
    </SideMenu>
  );
};

Home.navigationOptions = {
  header: null,
};

export default Home;
