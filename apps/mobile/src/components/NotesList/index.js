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

export const NotesList = ({keyword}) => {
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
  }, [keyword]);

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
            <Text
              style={{
                fontSize: SIZE.lg,
                fontFamily: WEIGHT.medium,
                color: colors.pri,
                paddingHorizontal: Platform.isPad ? '2.5%' : '5%',
                maxWidth: '100%',
              }}>
              Search Results for{' '}
              <Text
                style={{
                  color: colors.accent,
                }}>
                {keyword}{' '}
              </Text>
            </Text>
          </>
        }
        renderItem={({item, index}) => <NoteItem item={item} index={index} />}
      />
    </>
  );
};
