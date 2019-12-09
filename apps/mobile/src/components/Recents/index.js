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
  onThemeUpdate,
  clearThemeUpdateListener,
} from '../../common/common';

import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../Reminder';
import {getElevation} from '../../utils/utils';
import NoteItem from '../NoteItem';
import NavigationService from '../../services/NavigationService';
import {storage} from '../../../App';

export const RecentList = ({update, onScroll, margin}) => {
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

  useEffect(() => {
    onThemeUpdate(() => {
      setColors(COLOR_SCHEME);
    });
    return () => {
      clearThemeUpdateListener(() => {
        setColors(COLOR_SCHEME);
      });
    };
  }, []);

  return (
    <>
      <FlatList
        data={notes}
        onScroll={event => {
          y = event.nativeEvent.contentOffset.y;
          onScroll(y);
        }}
        style={{
          height: '100%',
          width: '100%',
        }}
        ListHeaderComponent={
          <View
            style={{
              marginTop: margin,
            }}
          />
        }
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
        keyExtractor={(item, index) => item.dateCreated.toString()}
        renderItem={({item, index}) => <NoteItem item={item} index={index} />}
      />
    </>
  );
};
