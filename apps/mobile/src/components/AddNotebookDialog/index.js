import React, {useState, createRef, useEffect} from 'react';
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

export const AddNotebookDialog = ({visible, close, toEdit = null}) => {
  const {colors} = useAppContext();
  const [topics, setTopics] = useState(['']);
  const [title, setTitle] = useState(null);

  const [description, setDescription] = useState(null);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  let listRef = createRef();
  let prevItem = null;
  let prevIndex = null;
  let currentSelectedInput = null;
  let timestamp = null;
  let backPressCount = 0;

  const onSubmit = (text, index, willFocus = false) => {
    console.log('here');
    let prevTopics = topics;
    prevTopics[index] = text;
    prevIndex = index;
    prevItem = text;

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
    if (!refs[index + 1]) {
      setTimeout(() => {
        if (!refs[index + 1]) return;
        refs[index + 1].focus();
      }, 300);
    } else {
      setTimeout(() => {
        refs[index + 1].focus();
      }, 300);
    }
  };

  const onBlur = (text, index) => {};

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

    let dateCreated = toEdit && toEdit.dateCreated ? toEdit.dateCreated : null;

    await db.addNotebook({
      title,
      description,
      topics,
      dateCreated: dateCreated,
    });

    prevIndex = null;
    prevItem = null;
    currentSelectedInput = null;
    refs = [];
    setTopics(['']);
    close(true);
    ToastEvent.show('New notebook added', 'success', 3000, () => {}, '');
  };

  onKeyPress = (event, index, text) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (backPressCount === 0 && (!text || text.length == 0)) {
        backPressCount = 1;

        return;
      }

      if (backPressCount === 1 && (!text || text.length == 0)) {
        backPressCount = 0;
        if (!refs[index] == 0) {
          refs[index - 1].focus();
        }
        onDelete(index);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animated
      animationType="fade"
      onShow={() => {
        refs = [];

        if (toEdit !== null) {
          let topicsList = [];
          toEdit.topics.forEach(item => {
            if (item.title !== 'General') {
              topicsList.push(item.title);
            }
          });
          topicsList.push('');
          setTopics([...topicsList]);
          setTitle(toEdit.title);
          timestamp = toEdit.dateCreated;
          setTimeout(() => {
            console.log(timestamp, title, topics);
          }, 400);
        }
      }}
      onRequestClose={() => (refs = [])}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : null}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.3)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <TouchableOpacity
          onPress={() => close()}
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
          }}
        />
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
              {toEdit ? 'Edit Notebook' : 'New Notebook'}
            </Text>
          </View>

          <TextInput
            style={{
              padding: pv - 5,
              borderWidth: 1.5,
              borderColor: titleFocused ? colors.accent : colors.nav,
              paddingHorizontal: ph,
              borderRadius: 5,
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              marginTop: 20,
              marginBottom: 5,
            }}
            onFocus={() => {
              setTitleFocused(true);
            }}
            onBlur={() => {
              setTitleFocused(false);
            }}
            defaultValue={toEdit ? toEdit.title : null}
            onChangeText={value => {
              setTitle(value);
            }}
            placeholder="Title of notebook"
            placeholderTextColor={colors.icon}
          />
          <TextInput
            style={{
              padding: pv - 5,
              borderWidth: 1.5,
              borderColor: descFocused ? colors.accent : colors.nav,
              paddingHorizontal: ph,
              borderRadius: 5,
              fontSize: SIZE.sm,
              fontFamily: WEIGHT.regular,
              color: colors.pri,
              marginTop: 5,
              marginBottom: 10,
            }}
            onFocus={() => {
              setDescFocused(true);
            }}
            onBlur={() => {
              setDescFocused(false);
            }}
            defaultValue={toEdit ? toEdit.description : null}
            onChangeText={value => {
              setDescription(value);
            }}
            placeholder="write a description"
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
            keyExtractor={(item, index) => item + index}
            renderItem={({item, index}) => (
              <TopicItem
                item={item}
                toEdit={toEdit ? true : false}
                index={index}
                colors={colors}
                onSubmit={onSubmit}
                onChange={onChange}
                onFocus={onFocus}
                onDelete={onDelete}
                onKeyPress={onKeyPress}
                onBlur={onBlur}
              />
            )}
          />

          <View
            style={{
              justifyContent: 'space-between',

              alignItems: 'center',
              flexDirection: 'row',
              width: '100%',
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
                width: '48%',
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
                width: '48%',
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
  toEdit,
  onKeyPress,
  onBlur,
}) => {
  const [focus, setFocus] = useState(false);
  const topicRef = ref => (refs[index] = ref);

  let text = item;

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',

        marginTop: 10,
      }}>
      <TextInput
        ref={topicRef}
        onFocus={() => {
          text = item;

          onFocus(index);
          setFocus(true);
        }}
        onBlur={() => {
          onBlur(text, index);
          setFocus(false);
        }}
        onChangeText={value => {
          onChange(value, index);
          text = value;
        }}
        onSubmitEditing={() => {
          onSubmit(text, index, true);
        }}
        blurOnSubmit
        onKeyPress={event => onKeyPress(event, index, text)}
        style={{
          padding: pv - 5,
          paddingHorizontal: 0,
          borderRadius: 5,
          borderWidth: 1.5,
          fontSize: SIZE.sm,
          borderColor: focus ? colors.accent : colors.nav,
          fontFamily: WEIGHT.regular,
          color: colors.pri,
          paddingHorizontal: ph,
          width: '85%',
          maxWidth: '85%',
        }}
        defaultValue={item}
        placeholder="Add a topic"
        placeholderTextColor={colors.icon}
      />

      <TouchableOpacity
        onPress={() => (!focus ? onDelete(index) : onSubmit(text, index, true))}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 1.5,
          borderColor: focus ? colors.accent : colors.nav,
          borderRadius: 5,
          width: 40,
          height: 40,
        }}>
        <Icon
          name={!focus ? 'minus' : 'plus'}
          size={SIZE.lg}
          color={focus ? colors.accent : colors.icon}
        />
      </TouchableOpacity>
    </View>
  );
};
