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
import Icon from 'react-native-vector-icons/Feather';
import {Reminder} from '../../components/Reminder';
import {ListItem} from '../../components/ListItem';
import {Header} from '../../components/header';
import NoteItem from '../../components/NoteItem';
import {NotebookItem} from '../../components/NotebookItem';
import {AddNotebookDialog} from '../../components/AddNotebookDialog';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

export const Move = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [addNotebook, setAddNotebook] = useState(false);

  return (
    <SafeAreaView>
      <AddNotebookDialog
        visible={addNotebook}
        close={() => setAddNotebook(false)}
      />
      <Header colors={colors} heading="Move to" canGoBack={false} />
      <FlatList
        style={{
          width: '100%',
        }}
        data={[
          {
            name: 'Class Notes',
            Qty: '8',
          },
          {
            name: 'Notes of water tabs',
            Qty: '3',
          },
          {
            name: 'My Lists',
            Qty: '3',
          },
        ]}
        ListHeaderComponent={
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={() => {
              setAddNotebook(true);
            }}
            style={{
              borderWidth: 1,
              borderRadius: 5,
              width: '90%',
              marginHorizontal: '5%',
              paddingHorizontal: ph,
              borderColor: '#f0f0f0',
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
              Create a new notebook
            </Text>
            <Icon name="plus" color="white" size={SIZE.lg} />
          </TouchableOpacity>
        }
        renderItem={({item, index}) => (
          <NotebookItem
            hideMore={true}
            item={item}
            index={index}
            colors={colors}
          />
        )}
      />
    </SafeAreaView>
  );
};

Move.navigationOptions = {
  header: null,
};

export default Move;
