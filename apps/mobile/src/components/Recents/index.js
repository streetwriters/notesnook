import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
  Platform,
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
import {storage} from '../../../App';

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

export const RecentList = ({update}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [notes, setNotes] = useState([]);
  const fetchNotes = async () => {
    let allNotes = await storage.getNotes();
    console.log(allNotes);
    if (allNotes) {
      setNotes(allNotes);
    }
  };
  useEffect(() => {
    fetchNotes();
  }, [update]);

  return (
    <>
      <FlatList
        data={notes}
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
                paddingHorizontal: Platform.isPad ? '2%' : '4%',
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
                    width: 100,
                    height: 100,
                    borderRadius: br,
                    backgroundColor:
                      item.icon === 'md-add' ? colors.accent : 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 30,
                    marginLeft: 5,
                    marginVertical: 20,
                    marginBottom: 20,
                    borderWidth: 1.5,
                    borderColor: '#f0f0f0',
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
            <TouchableOpacity
              style={{
                width: Platform.isPad ? '95%' : '90%',
                alignSelf: 'center',
                backgroundColor: 'red',
                padding: pv,
                borderRadius: 5,
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.bold,
                  color: 'white',
                }}>
                Sync Disabled
              </Text>
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  color: 'white',
                }}>
                Fix Now
              </Text>
            </TouchableOpacity>
          </>
        }
        renderItem={({item, index}) => <NoteItem item={item} index={index} />}
      />
    </>
  );
};
