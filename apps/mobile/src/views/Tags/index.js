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
import Icon from 'react-native-vector-icons/Ionicons';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Tags = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <SafeAreaView
      style={{
        height: '100%',
        justifyContent: 'center',
      }}>
      <View
        style={{
          height: '100%',
          marginTop: h * 0.1,
          width: '100%',
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
        }}>
        <ScrollView
          contentContainerStyle={{
            width: '90%',

            alignSelf: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
          {[
            '#home',
            '#school',
            '#water',
            '#love',
            '#hope',
            '#music',
            '#notesforbook',
            '#hate',
            '#worldofwonders',
            '#home',
            '#school',
            '#water',
            '#love',
            '#hope',
            '#music',
            '#notesforbook',
            '#hate',
            '#worldofwonders',
            '#home',
            '#school',
            '#water',
            '#love',
            '#hope',
            '#music',
            '#notesforbook',
            '#hate',
            '#worldofwonders',
            '#home',
            '#school',
            '#water',
            '#love',
            '#hope',
            '#music',
            '#notesforbook',
            '#hate',
            '#worldofwonders',
            '#home',
            '#school',
            '#water',
            '#love',
            '#hope',
            '#music',
            '#notesforbook',
            '#hate',
            '#worldofwonders',
            '#home',
            '#school',
            '#water',
            '#love',
            '#hope',
            '#music',
            '#notesforbook',
            '#hate',
            '#worldofwonders',
            '#home',
            '#school',
            '#water',
            '#love',
            '#hope',
            '#music',
            '#notesforbook',
            '#hate',
            '#worldofwonders',
          ].map(item => (
            <TouchableOpacity
              onPress={() => {
                NavigationService.navigate('Notes', {
                  heading: item,
                });
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                margin: 5,
                backgroundColor: colors.accent,
                paddingVertical: pv - 5,
                paddingHorizontal: ph + 10,
                borderRadius: 30,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.md,
                  color: 'white',
                }}>
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

Tags.navigationOptions = {
  header: null,
};

export default Tags;
