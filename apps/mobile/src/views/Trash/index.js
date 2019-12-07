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

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Trash = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const forceUpdate = useForceUpdate();

  useEffect(() => {
    onThemeUpdate(() => {
      forceUpdate();
    });
    return () => {
      clearThemeUpdateListener(() => {
        forceUpdate();
      });
    };
  }, []);
  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
      }}>
      <Header colors={colors} heading="Trash" canGoBack={false} />
      <FlatList
        numColumns={2}
        columnWrapperStyle={{
          width: '45%',
        }}
        style={{
          height: '80%',
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
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 15,
          backgroundColor: colors.accent,
        }}>
        <Text
          style={{
            fontSize: SIZE.md,
            fontFamily: WEIGHT.semibold,
            color: 'white',
          }}>
          <Icon name="plus" color="white" size={SIZE.lg} />
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
