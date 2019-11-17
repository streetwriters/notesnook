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

  const RenderSideMenu = (
    <SafeAreaView
      style={{
        height: '100%',
        justifyContent: 'center',
      }}>
      <View
        style={{
          backgroundColor: colors.accent,
          height: h * 0.5,
          width: h * 0.5,
          position: 'absolute',
          top: h * -0.15,
          left: h * -0.2,
          transform: [{rotateZ: '340deg'}],
          borderRadius: 100,
        }}
      />
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
          80.45/100 MB
        </Text>

        <View
          style={{
            borderRadius: 2.5,
            backgroundColor: 'white',
            marginTop: 10,
            paddingHorizontal: 5,
            paddingVertical: 2,
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xxs,
              color: colors.accent,
            }}>
            Basic User
          </Text>
        </View>
      </View>

      <View
        style={{
          backgroundColor: colors.navbg,
          width: '90%',
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
            },
          ]}
          keyExtractor={(item, index) => item.name}
          renderItem={({item, index}) => (
            <TouchableOpacity
              activeOpacity={opacity}
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

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  });

  return (
    <SideMenu
      bounceBackOnOverdraw={false}
      menu={RenderSideMenu}
      openMenuOffset={w / 1.5}>
      <SafeAreaView style={styles.container}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: '5%',
            marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
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
