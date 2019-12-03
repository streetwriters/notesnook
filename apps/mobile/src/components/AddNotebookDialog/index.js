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

import {getElevation, h, w, timeSince} from '../../utils/utils';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {useForceUpdate} from '../../views/ListsEditor';

const refs = [];

export const AddNotebookDialog = ({visible, close}) => {
  const [colors, setColors] = useState(COLOR_SCHEME);
  const [topicsToAdd, setTopicsToAdd] = useState(['']);
  const forceUpdate = useForceUpdate();
  let listRef = createRef();
  let prevItem = null;
  let prevIndex = null;
  let currentSelectedItem = null;

  const onSubmit = (text, index, willFocus = true) => {
    let oldData = topicsToAdd;
    oldData[index] = text;

    if (
      oldData.length === index + 1 &&
      prevIndex !== null &&
      prevItem !== null
    ) {
      oldData.push('');
    }

    setTopicsToAdd(oldData);
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
      let oldData = topicsToAdd;
      oldData[prevIndex] = prevItem;
      if (oldData.length === prevIndex + 1) {
        oldData.push('');
      }
      prevIndex = null;
      prevItem = null;
      setTopicsToAdd(oldData);
      console.log(oldData);
      forceUpdate();
    }
  };
  const onChange = (text, index) => {
    prevIndex = index;
    prevItem = text;
  };
  const onDelete = index => {
    console.log('deleting');
    let listData = topicsToAdd;
    if (listData.length === 1) return;
    refs.splice(index, 1);
    listData.splice(index, 1);
    console.log(refs, listData);
    setTopicsToAdd(listData);
    forceUpdate();
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
              borderColor: '#f0f0f0',
              paddingHorizontal: ph,
              borderRadius: 5,
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              marginTop: 20,
              marginBottom: 10,
            }}
            placeholder="Title of notebook"
            placeholderTextColor={colors.icon}
          />

          <Text
            style={{
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.semibold,
            }}>
            Topics
          </Text>

          <FlatList
            data={topicsToAdd}
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
                setTopicsToAdd(['']);
                prevIndex = null;
                prevItem = null;
                currentSelectedItem = null;
                close();
              }}
              style={{
                paddingVertical: pv,
                paddingHorizontal: ph,
                borderRadius: 5,
                width: '45%',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#f0f0f0',
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
        borderColor: '#f0f0f0',
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
