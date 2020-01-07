import React, {useEffect, useState} from 'react';
import {
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  View,
} from 'react-native';
import {SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {useAppContext} from '../../provider/useAppContext';
import {db} from '../../../App';
import {NotebookItem} from '../../components/NotebookItem';
import {Dialog} from '../../components/Dialog';
import {ToastEvent} from '../../utils/utils';
import {TrashPlaceHolder} from '../../components/ListPlaceholders';

export const Trash = ({navigation}) => {
  const {colors} = useAppContext();
  const [trash, setTrash] = useState([]);
  const [dialog, setDialog] = useState(false);
  useEffect(() => {
    let allTrash = db.getTrash();
    setTrash([...allTrash]);
  }, []);

  return (
    <SafeAreaView
      style={{
        backgroundColor: colors.bg,
        height: '100%',
      }}>
      <Dialog
        title="Empty Trash"
        visible={dialog}
        close={() => {
          setDialog(false);
        }}
        icon="trash"
        paragraph="Clearing all trash cannot be undone."
        positiveText="Clear"
        negativeText="Cancel"
        positivePress={async () => {
          await db.clearTrash();
          let allTrash = db.getTrash();
          setTrash([...allTrash]);
          ToastEvent.show('Trash cleared', 'success', 1000, () => {}, '');
          setDialog(false);
        }}
        negativePress={() => {
          setDialog(false);
        }}
      />
      <Header colors={colors} heading="Trash" canGoBack={false} menu={true} />

      <FlatList
        keyExtractor={item => item.dateCreated.toString()}
        style={{
          width: '100%',
          alignSelf: 'center',
          height: '100%',
        }}
        contentContainerStyle={{
          height: '100%',
        }}
        data={trash}
        ListEmptyComponent={
          <View
            style={{
              height: '80%',
              width: '100%',
              alignItems: 'center',
              alignSelf: 'center',
              justifyContent: 'center',
              opacity: 0.8,
            }}>
            <TrashPlaceHolder colors={colors} />
            <Text
              style={{
                color: colors.icon,
                fontSize: SIZE.md,
                fontFamily: WEIGHT.regular,
                marginTop: 20,
              }}>
              Deleted notes & notebooks appear here.
            </Text>
            <Text
              style={{
                fontSize: SIZE.sm,
                color: colors.icon,
                marginTop: 20,
              }}>
              Trash is empty
            </Text>
          </View>
        }
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
          setDialog(true);
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
          {'  '}Clear all trash
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

Trash.navigationOptions = {
  header: null,
};

export default Trash;
