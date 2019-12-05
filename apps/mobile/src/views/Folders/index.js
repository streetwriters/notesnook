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
  Modal,
  KeyboardAvoidingView,
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
import {getElevation, h, w, timeSince} from '../../utils/utils';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {useForceUpdate} from '../ListsEditor';
import {AddNotebookDialog} from '../../components/AddNotebookDialog';
import {NotebookItem} from '../../components/NotebookItem';
import {Search} from '../../components/SearchInput';

export const Folders = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [addNotebook, setAddNotebook] = useState(false);
  const [notebooks, setNotebooks] = useState([]);
  const params = navigation.state.params;

  return (
    <SafeAreaView
      style={{
        height: '100%',
      }}>
      <AddNotebookDialog
        visible={addNotebook}
        close={() => setAddNotebook(false)}
      />
      <KeyboardAvoidingView
        style={{
          height: '100%',
        }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: '5%',
            marginTop: Platform.OS == 'ios' ? h * 0.02 : h * 0.04,
            marginBottom: h * 0.04,
          }}>
          <Text
            style={{
              fontSize: SIZE.xxl,
              color: colors.pri,
              fontFamily: WEIGHT.bold,
            }}>
            {params.title}
          </Text>
          <Icon
            style={{
              marginTop: 10,
            }}
            name="more-vertical"
            color={colors.icon}
            size={SIZE.xxl}
          />
        </View>
        <Search />
        <FlatList
          style={{
            width: '100%',
          }}
          data={notebooks}
          renderItem={({item, index}) => (
            <NotebookItem
              hideMore={params.hideMore}
              item={item}
              index={index}
              colors={colors}
            />
          )}
        />
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
