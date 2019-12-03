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

export const Trash = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);

  return (
    <SafeAreaView>
      <Header colors={colors} heading="Trash" canGoBack={false} />
      <FlatList
        numColumns={2}
        columnWrapperStyle={{
          width: '45%',
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
    </SafeAreaView>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
