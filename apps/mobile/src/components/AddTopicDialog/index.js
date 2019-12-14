import React, {useEffect, useState, createRef} from 'react';
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

import {getElevation, h, w, timeSince, ToastEvent} from '../../utils/utils';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {useForceUpdate} from '../../views/ListsEditor';
import {db} from '../../../App';

export const AddTopicDialog = ({
  visible,
  close = () => {},
  notebookID,
  toEdit = null,
}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [topics, setTopics] = useState(['']);
  const forceUpdate = useForceUpdate();
  const setTitleRef = createRef();
  let description = 'my first notebook';
  let title = null;
  const addNewTopic = async () => {
    if (!title)
      return ToastEvent.show('Title is required', 'error', 3000, () => {}, '');
    console.log(notebookID, title);
    db.addTopicToNotebook(notebookID, title);
    ToastEvent.show('New topic added', 'success', 3000, () => {}, '');
    close(true);
  };

  return (
    <Modal
      visible={visible}
      animated
      animationType="fade"
      transparent={true}
      onRequestClose={() => (refs = [])}>
      <View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(255,255,255,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <View
          style={{
            ...getElevation(5),
            width: '80%',
            maxHeight: 350,

            borderRadius: 5,
            backgroundColor: colors.bg,
            paddingHorizontal: ph,
            paddingVertical: pv,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
            <Icon name="book-open" color={colors.accent} size={SIZE.lg} />
            <Text
              style={{
                color: colors.accent,
                fontFamily: WEIGHT.bold,
                marginLeft: 5,
                fontSize: SIZE.md,
              }}>
              {toEdit ? 'Edit Topic' : 'Add New Topic'}
            </Text>
          </View>

          <TextInput
            style={{
              padding: pv,
              borderWidth: 1.5,
              borderColor: colors.nav,
              paddingHorizontal: ph,
              borderRadius: 5,
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              marginTop: 20,
            }}
            defaultValue={toEdit ? toEdit.title : null}
            onChangeText={value => {
              title = value;
            }}
            placeholder="Enter title of topic"
            placeholderTextColor={colors.icon}
          />

          <View
            style={{
              justifyContent: 'space-around',
              alignItems: 'center',
              flexDirection: 'row',
              marginTop: 20,
            }}>
            <TouchableOpacity
              activeOpacity={opacity}
              onPress={async () => await addNewTopic()}
              style={{
                paddingVertical: pv,
                paddingHorizontal: ph,
                borderRadius: 5,
                width: '45%',
                justifyContent: 'center',
                alignItems: 'center',
                borderColor: colors.accent,
                backgroundColor: colors.accent,
                borderWidth: 1,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  color: 'white',
                  fontSize: SIZE.sm,
                }}>
                Add
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={opacity}
              onPress={() => close()}
              style={{
                paddingVertical: pv,
                paddingHorizontal: ph,
                borderRadius: 5,
                width: '45%',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: colors.nav,
              }}>
              <Text
                style={{
                  fontFamily: WEIGHT.medium,
                  color: colors.icon,
                  fontSize: SIZE.sm,
                }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
