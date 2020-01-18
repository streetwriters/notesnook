import React, {useState} from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {FlatList, TextInput} from 'react-native-gesture-handler';
import Icon from 'react-native-vector-icons/Feather';
import {db, DDS} from '../../../App';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider';
import {getElevation, ToastEvent} from '../../utils/utils';
import {updateEvent} from '../DialogManager';

let refs = [];

export class AddNotebookDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      topics: [''],
      title: null,
      description: null,
      titleFocused: false,
      descFocused: false,
    };

    this.listRef;
    this.prevItem = null;
    this.prevIndex = null;
    this.currentSelectedInput = null;
    this.timestamp = null;
    this.backPressCount = 0;
  }

  open() {
    refs = [];
    let {toEdit} = this.props;

    if (toEdit !== null) {
      let topicsList = [];
      toEdit.topics.forEach(item => {
        if (item.title !== 'General') {
          topicsList.push(item.title);
        }
      });
      topicsList.push('');

      this.setState({
        topics: [...topicsList],
        title: toEdit.title,
        visible: true,
      });
      this.timestamp = toEdit.dateCreated;
    }
  }
  close() {
    refs = [];
    this.prevIndex = null;
    this.prevItem = null;
    this.currentSelectedInput = null;
    this.setState({
      visible: false,
      topics: [''],
    });
  }

  onSubmit = (text, index, willFocus = false) => {
    let prevTopics = topics;
    prevTopics[index] = text;
    this.prevIndex = index;
    this.prevItem = text;

    if (
      prevTopics.length === index + 1 &&
      this.prevIndex !== null &&
      this.prevItem !== null
    ) {
      prevTopics.push('');
    }

    let nextTopics = [...prevTopics];
    this.setState({
      topics: nextTopics,
    });
    this.currentSelectedInput = null;
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

  onBlur = (text, index) => {};

  onFocus = index => {
    this.currentSelectedInput = index;

    if (this.currentSelectedInput) {
      let prevTopics = topics;

      prevTopics[this.prevIndex] = this.prevItem;
      if (prevTopics.length === this.prevIndex + 1) {
        prevTopics.push('');
      }
      this.prevIndex = null;
      this.prevItem = null;

      let nextTopics = [...prevTopics];
      this.setState({
        topics: nextTopics,
      });
    }
  };
  onChange = (text, index) => {
    this.prevIndex = index;
    this.prevItem = text;
  };

  onDelete = index => {
    let prevTopics = topics;
    if (prevTopics.length === 1) return;
    refs = [];
    prevTopics.splice(index, 1);
    let nextTopics = [...prevTopics];
    this.setState({
      topics: nextTopics,
    });
  };

  addNewNotebook = async () => {
    let {toEdit} = this.props;
    if (!title)
      return ToastEvent.show('Title is required', 'error', 3000, () => {}, '');

    let dateCreated = toEdit && toEdit.dateCreated ? toEdit.dateCreated : null;

    await db.addNotebook({
      title,
      description,
      topics,
      dateCreated: dateCreated,
    });
    updateEvent({type: ACTIONS.NOTEBOOKS});
    this.close();
    ToastEvent.show('New notebook added', 'success', 3000, () => {}, '');
  };

  onKeyPress = (event, index, text) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (this.backPressCount === 0 && (!text || text.length == 0)) {
        this.backPressCount = 1;

        return;
      }
      if (this.backPressCount === 1 && (!text || text.length == 0)) {
        this.backPressCount = 0;
        if (!refs[index] == 0) {
          refs[index - 1].focus();
        }
        this.onDelete(index);
      }
    }
  };

  render() {
    const {colors, toEdit} = this.props;
    const {
      titleFocused,
      descFocused,
      description,
      title,
      topics,
      visible,
    } = this.state;
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
                this.setState({
                  titleFocused: true,
                });
              }}
              onBlur={() => {
                this.setState({
                  titleFocused: false,
                });
              }}
              defaultValue={toEdit ? toEdit.title : null}
              onChangeText={value => {
                this.setState({
                  title: value,
                });
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
                this.setState({
                  descFocused: true,
                });
              }}
              onBlur={() => {
                this.setState({
                  descFocused: false,
                });
              }}
              defaultValue={toEdit ? toEdit.description : null}
              onChangeText={value => {
                this.setState({
                  description: value,
                });
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
              ref={ref => (this.listRef = ref)}
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
                  onSubmit={this.onSubmit}
                  onChange={this.onChange}
                  onFocus={this.onFocus}
                  onDelete={this.onDelete}
                  onKeyPress={this.onKeyPress}
                  onBlur={this.onBlur}
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
                  await this.addNewNotebook();
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
                  this.close();
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
  }
}

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
