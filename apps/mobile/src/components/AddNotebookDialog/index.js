import React, {useState, createRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Modal,
  KeyboardAvoidingView,
} from 'react-native';
import {SIZE, ph, pv, opacity, WEIGHT} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';

import {getElevation, ToastEvent} from '../../utils/utils';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import {db, DDS} from '../../../App';
import {useAppContext} from '../../provider/useAppContext';

let refs = [];

export const AddNotebookDialog = ({visible, close}) => {
  const {colors} = useAppContext();
  const [topics, setTopics] = useState(['']);
  const [title, setTitle] = useState(null);

  let listRef = createRef();
  let prevItem = null;
  let prevIndex = null;
  let currentSelectedInput = null;

  let description = 'my first notebook';
  const onSubmit = (text, index, willFocus = true) => {
    let prevTopics = topics;
    prevTopics[index] = text;

    if (
      prevTopics.length === index + 1 &&
      prevIndex !== null &&
      prevItem !== null
    ) {
      prevTopics.push('');
    }

    let nextTopics = [...prevTopics];

    setTopics(nextTopics);

    currentSelectedInput = null;

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
    currentSelectedInput = index;

    if (currentSelectedInput) {
      let prevTopics = topics;

      prevTopics[prevIndex] = prevItem;
      if (prevTopics.length === prevIndex + 1) {
        prevTopics.push('');
      }
      prevIndex = null;
      prevItem = null;

      let nextTopics = [...prevTopics];

      setTopics(nextTopics);
    }
  };
  const onChange = (text, index) => {
    prevIndex = index;
    prevItem = text;
  };

  const onDelete = index => {
    let prevTopics = topics;

    if (prevTopics.length === 1) return;

    refs = [];
    prevTopics.splice(index, 1);

    let nextTopics = [...prevTopics];

    setTopics(nextTopics);
  };

  const addNewNotebook = async () => {
    if (!title)
      return ToastEvent.show('Title is required', 'error', 3000, () => {}, '');

    await db.addNotebook({
      title,
      description,
      topics,
    });
    ToastEvent.show('New notebook added', 'success', 3000, () => {}, '');
    setTopics(['']);
    prevIndex = null;
    prevItem = null;
    currentSelectedInput = null;
    refs = [];
    close(true);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      animationType="fade"
      onRequestClose={() => (refs = [])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
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
            width: DDS.isTab ? '50%' : '80%',
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
              fontFamily: WEIGHT.bold,
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

                refs = [];
                prevIndex = null;
                prevItem = null;
                currentSelectedInput = null;

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
      </KeyboardAvoidingView>
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
