import React, {useEffect, useState} from 'react';
import {ScrollView, View, Text, TouchableOpacity} from 'react-native';

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
import {styles} from './styles';

import Icon from 'react-native-vector-icons/Ionicons';
import {Search} from '../../components/SearchInput';
import {Reminder} from '../../components/Reminder';
import {RecentList} from '../../components/Recents';

export const Home = ({navigation}) => {
  const [loading, setLoading] = useState(true);
  const [colors, setColors] = useState(COLOR_SCHEME);

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  });

  return (
    <View style={styles.container}>
      <Search />

      <ScrollView
        horizontal={true}
        style={{
          paddingHorizontal: '5%',
          height: 200,
        }}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'row',
        }}>
        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: 100,
            height: 100,
            borderRadius: br,
            backgroundColor: colors.accent,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            marginRight: 30,
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="md-add" color="white" size={SIZE.xxl} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: 100,
            height: 100,
            borderRadius: br,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="ios-clock" color={colors.icon} size={SIZE.xxl} />
            <Text
              style={{
                fontSize: SIZE.sm - 2,
                color: colors.icon,
                fontFamily: WEIGHT.regular,
              }}>
              Reminders
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={opacity}
          style={{
            width: 100,
            height: 100,
            borderRadius: br,
            backgroundColor: '#f0f0f0',
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            marginLeft: 30,
            marginRight: 30,
          }}>
          <View
            style={{
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="ios-list" color={colors.icon} size={SIZE.xxl} />
            <Text
              style={{
                fontSize: SIZE.sm - 2,
                color: colors.icon,
                fontFamily: WEIGHT.regular,
              }}>
              Lists
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      <Reminder />

      <RecentList />
    </View>
  );
};

Home.navigationOptions = {
  header: null,
};

export default Home;
