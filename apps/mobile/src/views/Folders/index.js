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
import Icon from 'react-native-vector-icons/Ionicons';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {getElevation} from '../../utils/utils';
import {FlatList} from 'react-native-gesture-handler';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Folders = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <SafeAreaView>
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
          Folders
        </Text>
        <Icon name="md-more" color={colors.icon} size={SIZE.xxl} />
      </View>

      <FlatList
        numColumns={2}
        style={{
          width: '100%',
        }}
        columnWrapperStyle={{
          paddingHorizontal: '5%',
          justifyContent: 'space-between',
          width: '100%',
        }}
        data={[
          {
            name: 'Class Notes',
            Qty: '8',
          },
          {
            name: 'Notes of water tabs',
            Qty: '3',
          },
          {
            name: 'My Lists',
            Qty: '3',
          },
        ]}
        renderItem={({item, index}) => (
          <View>
            <View
              style={{
                ...getElevation(5),
                width: w * 0.4,
                height: w * 0.3,
                borderRadius: 5,
                backgroundColor: colors.accent,
                alignItems: 'flex-end',
                justifyContent: 'flex-end',
                padding: 5,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.lg,
                  color: 'white',
                  opacity: 0.5,
                }}>
                {item.Qty} Files
              </Text>
            </View>
            <Text
              style={{
                fontFamily: WEIGHT.bold,
                fontSize: SIZE.md,
                color: colors.pri,
                maxWidth: w * 0.4,
              }}>
              {item.name}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
