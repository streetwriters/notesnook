import React, {useState} from 'react';
import {View, Text, TouchableOpacity, Platform, Dimensions} from 'react-native';
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
import {getElevation} from '../../utils/utils';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;
export const Reminder = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <TouchableOpacity
      activeOpacity={opacity}
      style={{
        ...getElevation(10),
        width: '90%',
        marginVertical: Platform.OS === 'ios' ? h * 0.01 : '0%',
        alignSelf: 'center',
        borderRadius: br,
        backgroundColor: colors.accent,
        paddingHorizontal: ph,
        marginBottom: 20,
        padding: 5,
      }}>
      <View>
        <Text
          numberOfLines={1}
          style={{
            width: '100%',
            maxWidth: '100%',
          }}>
          <Text
            numberOfLines={1}
            style={{
              color: 'white',
              fontSize: SIZE.lg,
              fontFamily: WEIGHT.bold,
              maxWidth: '100%',
            }}>
            Pay Utility Bills
          </Text>
        </Text>

        <View
          style={{
            width: '100%',
            justifyContent: 'space-between',
            flexDirection: 'row',
            alignItems: 'flex-end',
          }}>
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs,
              color: 'white',
              marginBottom: 3,
            }}>
            {'\n'}
            Amount 5000 RS
          </Text>

          <Text
            style={{
              color: 'white',
              fontSize: SIZE.xxl,
              fontFamily: WEIGHT.light,
            }}>
            <Text
              style={{
                fontSize: SIZE.xs,
              }}>
              in
            </Text>
            00:00{''}
            <Text
              style={{
                fontSize: SIZE.xs,
              }}>
              mins
            </Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
