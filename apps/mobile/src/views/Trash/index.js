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
import {db, DDS} from '../../../App';
import {NotebookItem} from '../../components/NotebookItem';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Trash = ({navigation}) => {
  const {colors} = useAppContext();
  const [trash, setTrash] = useState([]);
  useEffect(() => {
    let allTrash = db.getTrash();

    setTrash([...allTrash]);
    console.log(allTrash);
  }, []);

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <Header colors={colors} heading="Trash" canGoBack={false} menu={true} />
      <FlatList
        numColumns={1}
        style={{
          width: DDS.isTab ? '95%' : '90%',
          alignSelf: 'center',
        }}
        data={trash}
        renderItem={({item, index}) =>
          item.type === 'note' ? (
            <NoteItem item={item} index={index} isTrash={true} />
          ) : (
            <NotebookItem item={item} isTrash={true} index={index} />
          )
        }
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
            fontFamily: WEIGHT.regular,
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
