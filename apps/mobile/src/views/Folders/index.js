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

const refs = [];

export const Folders = ({navigation}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [addNotebook, setAddNotebook] = useState(false);
  return (
    <SafeAreaView>
      <AddNotebookDialog visible={addNotebook} />
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
          Notebooks
        </Text>
        <Icon name="more-vertical" color={colors.icon} size={SIZE.xxl} />
      </View>

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
                fontFamily: WEIGHT.bold,
                color: 'white',
              }}>
              Create new notebook
            </Text>
            <Icon name="plus" color="white" size={SIZE.lg} />
          </TouchableOpacity>
        }
        renderItem={({item, index}) => (
          <View
            style={{
              paddingHorizontal: ph,
              marginHorizontal: '5%',
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
              paddingVertical: pv + 5,
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.bold,
                fontSize: SIZE.md,
                color: colors.pri,
                maxWidth: '100%',
              }}>
              {item.name}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingTop: pv,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.xs,
                  color: colors.accent,
                }}>
                June 21
              </Text>
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.xs,
                }}>
                15 notes
              </Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

Folders.navigationOptions = {
  header: null,
};

export default Folders;
