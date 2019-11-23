import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
} from 'react-native';

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
import {Reminder} from '../Reminder';
import {getElevation} from '../../utils/utils';
import NoteItem from '../NoteItem';
import NavigationService from '../../services/NavigationService';
const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

// example data

const data = [
  {
    title: 'One day about',
    headline: 'Lorem Ipsum  Lorem Ipsum has',
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
];

export const RecentList = () => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  let blockdata = [
    {
      name: '',
      icon: 'md-add',
      func: () => {
        NavigationService.navigate('Editor');
      },
    },
    {
      name: 'All Notes',
      icon: 'md-create',
      func: () => {
        NavigationService.navigate('Reminders');
      },
    },
    {
      name: 'Lists',
      icon: 'ios-list',
      func: () => {
        NavigationService.navigate('Lists');
      },
    },
  ];

  return (
    <>
      <FlatList
        data={data}
        ListFooterComponent={
          <View
            style={{
              height: 150,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text
              style={{
                color: colors.navbg,
                fontSize: SIZE.sm,
                fontFamily: WEIGHT.regular,
              }}>
              - End -
            </Text>
          </View>
        }
        ListHeaderComponent={
          <>
            <ScrollView
              horizontal={true}
              style={{
                paddingHorizontal: '4%',
              }}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'row',
              }}>
              {blockdata.map(item => (
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
                    marginVertical: 20,
                    marginBottom: 30,
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
          </>
        }
        renderItem={({item, index}) => <NoteItem item={item} index={index} />}
      />
    </>
  );
};
