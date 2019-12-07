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
import {FlatList} from 'react-native-gesture-handler';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;
export const ListItem = props => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <View
      style={{
        ...getElevation(10),
        width: '90%',
        marginVertical: Platform.OS === 'ios' ? h * 0.01 : '0%',
        alignSelf: 'center',
        borderRadius: br,
        backgroundColor: colors.nav,

        marginBottom: 20,
        padding: 5,
      }}>
      <View>
        <View
          style={{
            width: '100%',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: ph,
          }}>
          <Text
            numberOfLines={1}
            style={{
              color: colors.pri,
              fontSize: SIZE.md,
              fontFamily: WEIGHT.bold,
              maxWidth: '100%',
            }}>
            Shopping List
          </Text>

          <View
            style={{
              width: '20%',
              justifyContent: 'space-between',
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Icon name="md-share-alt" size={SIZE.lg} color={colors.icon} />
            <Icon name="md-star" size={SIZE.lg} color={colors.icon} />
            <Icon name="md-more" size={SIZE.lg} color={colors.icon} />
          </View>
        </View>

        <View>
          <FlatList
            data={['1 kg wheat flour', '1/2 kg bread']}
            renderItem={({item, index}) => (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                }}>
                <Text
                  style={{
                    color: 'white',
                    ...getElevation(5),
                    paddingVertical: pv - 5,
                    paddingHorizontal: ph - 5,
                    backgroundColor: colors.accent,
                    marginVertical: 5,
                    borderRadius: br,
                    marginHorizontal: 10,
                    fontFamily: WEIGHT.regular,
                  }}>
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </View>
  );
};
