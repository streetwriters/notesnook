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
  clearThemeUpdateListener,
  onThemeUpdate,
} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {useForceUpdate} from '../ListsEditor';
import {useAppContext} from '../../provider/useAppContext';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Trash = ({navigation}) => {
  const {colors} = useAppContext();
  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <Header colors={colors} heading="Trash" canGoBack={false} />
      <FlatList
        numColumns={2}
        columnWrapperStyle={{
          width: '45%',
          marginHorizontal: '2.5%',
        }}
        style={{
          width: '100%',
        }}
        data={[
          {
            title: 'my note',
            headline: 'my simple not that i just deleted. please restore.',
            dateCreated: Date.now(),
          },
          {
            title: 'my note',
            headline: 'my simple not that i just deleted. please restore.',
            dateCreated: Date.now(),
          },
        ]}
        renderItem={({item, index}) => <NoteItem item={item} />}
      />
      <TouchableOpacity
        activeOpacity={opacity}
        onPress={() => {
          setAddNotebook(true);
        }}
        style={{
          borderRadius: 5,
          width: '90%',
          marginHorizontal: '5%',
          paddingHorizontal: ph,
          paddingVertical: pv + 5,
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center',
          marginBottom: 20,
          backgroundColor: colors.accent,
        }}>
        <Icon name="trash" color="white" size={SIZE.lg} />
        <Text
          style={{
            fontSize: SIZE.md,
            fontFamily: WEIGHT.semibold,
            color: 'white',
          }}>
          {'  '}Clear all Trash
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
