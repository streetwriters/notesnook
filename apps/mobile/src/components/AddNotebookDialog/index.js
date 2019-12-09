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
import {storage} from '../../../App';

let refs = [];

export const AddNotebookDialog = ({visible, close}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [topics, setTopics] = useState(['']);
  const [title, setTitle] = useState(null);
  const forceUpdate = useForceUpdate();

  let listRef = createRef();
  let prevItem = null;
  let prevIndex = null;
  let currentSelectedItem = null;

  let description = 'my first notebook';
  const onSubmit = (text, index, willFocus = true) => {
    let oldData = topics;
    oldData[index] = text;

    if (
      oldData.length === index + 1 &&
      prevIndex !== null &&
      prevItem !== null
    ) {
      oldData.push('');
    }
    setTopics(oldData);
    forceUpdate();
    currentSelectedItem = null;

    //if (!willFocus) return;
    if (!refs[index + 1]) {
      setTimeout(() => {
        if (!refs[index + 1]) return;

        refs[index + 1].focus();
      }, 400);
    } else {
      setTimeout(() => {
        refs[index + 1].focus();
      }, 400);
    }
  };
  const onFocus = index => {
    currentSelectedItem = index;
    if (currentSelectedItem) {
      let oldData = topics;
      oldData[prevIndex] = prevItem;
      if (oldData.length === prevIndex + 1) {
        oldData.push('');
      }
      prevIndex = null;
      prevItem = null;
      setTopics(oldData);
      forceUpdate();
    }
  };
  const onChange = (text, index) => {
    prevIndex = index;
    prevItem = text;
  };
  const onDelete = index => {
    let listData = topics;
    if (listData.length === 1) return;
    refs.splice(index, 1);
    listData.splice(index, 1);

    setTopics(listData);
    forceUpdate();
  };

  const addNewNotebook = async () => {
    if (!title)
      return ToastEvent.show('Title is required', 'error', 3000, () => {}, '');

    await storage.addNotebook({
      title,
      description,
      topics,
    });
    ToastEvent.show('New notebook added', 'success', 3000, () => {}, '');
    setTopics(['']);
    prevIndex = null;
    prevItem = null;
    currentSelectedItem = null;
    refs = [];
    close(true);
  };

  return (
    <Modal
      visible={visible}
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
            width: '80%',
            maxHeight: 350,
            elevation: 5,
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
                fontFamily: WEIGHT.semibold,
                marginLeft: 10,
                fontSize: SIZE.lg,
                marginTop: -5,
              }}>
              New Notebook
            </Text>
          </View>

          <TextInput
            style={{
              padding: pv - 5,
              borderWidth: 1.5,
              borderColor: colors.nav,
              paddingHorizontal: ph,
              borderRadius: 5,
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              marginTop: 20,
              marginBottom: 10,
            }}
            onChangeText={value => {
              setTitle(value);
            }}
            placeholder="Title of notebook"
            placeholderTextColor={colors.icon}
          />

          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.semibold,
              color: colors.pri,
            }}>
            Topics:
          </Text>

          <FlatList
            data={topics}
            ref={listRef}
            removeClippedSubviews={false}
            enableEmptySections={false}
            getItemLayout={(data, index) => ({
              length: 50,
              offset: 50 * index,
              index,
            })}
            renderItem={({item, index}) => (
              <TopicItem
                item={item}
                index={index}
                colors={colors}
                onSubmit={onSubmit}
                onChange={onChange}
                onFocus={onFocus}
                onDelete={onDelete}
              />
            )}
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
              onPress={async () => {
                await addNewNotebook();
              }}
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
              onPress={() => {
                setTopics(['']);
                prevIndex = null;
                prevItem = null;
                currentSelectedItem = null;
                refs = [];
                close();
              }}
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

const TopicItem = ({
  item,
  index,
  onFocus,
  onSubmit,
  onDelete,
  onChange,
  colors,
}) => {
  const [focus, setFocus] = useState(true);
  const topicRef = ref => (refs[index] = ref);

  let text = item;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: colors.nav,
        paddingHorizontal: ph,
        marginTop: 10,
      }}>
      <TextInput
        ref={topicRef}
        onFocus={() => {
          onFocus(index);

          setFocus(true);
        }}
        onBlur={() => {
          onSubmit(text, index, false);
          setFocus(false);
        }}
        onChangeText={value => {
          onChange(value, index);

          text = value;
        }}
        onSubmit={() => onSubmit(text, index, true)}
        blurOnSubmit
        style={{
          padding: pv - 5,
          paddingHorizontal: 0,
          fontSize: SIZE.sm,
          fontFamily: WEIGHT.regular,
          color: colors.pri,
          width: '90%',
          maxWidth: '90%',
        }}
        placeholder="Add a topic"
        placeholderTextColor={colors.icon}
      />

      <TouchableOpacity
        onPress={() => (!focus ? onDelete(index) : onSubmit(text, index, true))}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Icon
          name={!focus ? 'minus' : 'plus'}
          size={SIZE.lg}
          color={colors.accent}
        />
      </TouchableOpacity>
    </View>
  );
};
