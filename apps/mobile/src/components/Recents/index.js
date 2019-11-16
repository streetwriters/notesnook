import React, {useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';

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

import Icon from 'react-native-vector-icons/Ionicons';
import {FlatList} from 'react-native-gesture-handler';

export const RecentList = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: '5%',
          marginTop: '7.5%',
          marginBottom: '0%',
        }}>
        <Text
          style={{
            fontSize: SIZE.lg,
            color: colors.icon,
            fontFamily: WEIGHT.regular,
          }}>
          Recents
        </Text>
        <Icon name="ios-albums" color={colors.icon} size={SIZE.xl} />
      </View>

      <FlatList
        data={[
          {
            title: 'One day about',
            headline:
              'Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has',
            timestamp: '2 hours ago',
            type: 'note',
          },
          {
            title: 'Shopping List',
            headline:
              'It is a long established fact that a reader will be distracted by the readable content of',
            timestamp: '5 hours ago',
            type: 'list',
          },
          {
            title: 'Reminder',
            headline:
              'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a ',
            timestamp: '2 days ago',
            type: 'reminder',
          },
          {
            title: 'Writing Notes for',
            headline:
              'There are many variations of passages of Lorem Ipsum available, but the majority have ',
            timestamp: '2 months ago',
          },
        ]}
        renderItem={({item, index}) => (
          <TouchableOpacity
            activeOpacity={opacity}
            style={{
              marginHorizontal: '5%',
              backgroundColor: '#f0f0f0',
              marginVertical: '2.5%',
              borderRadius: br,
              paddingVertical: pv - 5,
            }}>
            <Text
              style={{
                fontSize: SIZE.md,
                paddingHorizontal: ph,
                paddingTop: pv,
                fontFamily: WEIGHT.bold,
              }}>
              {item.title}
            </Text>
            <Text
              style={{
                fontSize: SIZE.xs + 1,
                paddingHorizontal: ph,
                color: colors.icon,
                fontFamily: WEIGHT.regular,
              }}>
              {item.headline}
            </Text>

            <View
              style={{
                height: 30,
                width: '100%',
                borderRadius: 5,
                justifyContent: 'space-between',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: ph,
              }}>
              <Text
                style={{
                  color: colors.accent,
                  fontSize: SIZE.xxs,
                  textAlignVertical: 'center',
                  fontFamily: WEIGHT.regular,
                }}>
                {item.timestamp + '  '}
              </Text>

              <View
                style={{
                  justifyContent: 'space-between',
                  flexDirection: 'row',
                  alignItems: 'center',
                  width: '15%',
                }}>
                <Icon name="ios-share" color={colors.accent} size={SIZE.lg} />
                <Icon name="ios-trash" color={colors.accent} size={SIZE.lg} />
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </>
  );
};
