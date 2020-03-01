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
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {db, DDS} from '../../../App';
import {opacity, ph, pv, SIZE, WEIGHT} from '../../common/common';
import {ACTIONS} from '../../provider/actions';
import {getElevation, ToastEvent} from '../../utils/utils';
import {updateEvent} from '../DialogManager';

let refs = [];

export class AddNotebookDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      topics: [],
      description: null,
      titleFocused: false,
      descFocused: false,
      count: 0,
      topicInputFoused: false,
    };
    this.title = null;
    this.description = null;
    this.listRef;
    this.prevItem = null;
    this.prevIndex = null;
    this.currentSelectedInput = null;
    this.id = null;
    this.backPressCount = 0;
    this.currentInputValue = null;
    this.titleRef;
    this.descriptionRef;
  }

  open = () => {
    refs = [];
    let {toEdit} = this.props;

    if (toEdit && toEdit.type === 'notebook') {
      let topicsList = [];
      toEdit.topics.forEach(item => {
        if (item.title !== 'General') {
          topicsList.push(item.title);
        }
      });
      this.id = toEdit.id;
      this.title = toEdit.title;
      this.description = toEdit.description;

      this.setState({
        topics: [...topicsList],

        visible: true,
      });
    } else {
      this.setState({
        visible: true,
      });
    }
  };

  close = () => {
    refs = [];
    this.prevIndex = null;
    this.prevItem = null;
    this.currentSelectedInput = null;
    this.title = null;
    this.description = null;
    this.id = null;
    this.setState({
      visible: false,
      topics: [],
      descFocused: false,
      titleFocused: false,
    });
  };

  onDelete = index => {
    let {topics} = this.state;
    let prevTopics = topics;
    refs = [];
    prevTopics.splice(index, 1);
    let nextTopics = [...prevTopics];
    if (this.prevIndex === index) {
      this.prevIndex = null;
      this.prevItem = null;
      this.currentInputValue = null;
      this.topicInputRef.setNativeProps({
        text: null,
      });
    }
    this.setState({
      topics: nextTopics,
    });
  };

  addNewNotebook = async () => {
    if (this.currentInputValue) {
      this.onSubmit();
    }
    let {topics} = this.state;
    let {toEdit} = this.props;
    if (!this.title)
      return ToastEvent.show('Title is required', 'error', 3000, () => {}, '');

    let id = toEdit && toEdit.id ? toEdit.id : null;

    if (id) {
      await db.notebooks.add({
        title: this.title,
        description: this.description,
        id: id,
      });

      await db.notebooks.notebook(id).topics.add(...topics);
    } else {
      await db.notebooks.add({
        title: this.title,
        description: this.description,
        topics,
        id: id,
      });
    }

    updateEvent({type: ACTIONS.NOTEBOOKS});
    this.close();
    ToastEvent.show('New notebook added', 'success', 3000, () => {}, '');
  };

  onSubmit = () => {
    let {topics} = this.state;
    if (
      !this.currentInputValue ||
      this.currentInputValue === '' ||
      this.currentInputValue === ' '
    )
      return;

    let prevTopics = [...topics];
    if (this.prevItem === null) {
      prevTopics.push(this.currentInputValue);
      this.setState({
        topics: prevTopics,
      });
      this.topicInputRef.setNativeProps({
        text: null,
      });

      setTimeout(() => {
        this.listRef.scrollToEnd({animated: true});
      }, 30);
      this.currentInputValue = null;
    } else {
      prevTopics[this.prevIndex] = this.currentInputValue;
      this.setState({
        topics: prevTopics,
      });
      this.currentInputValue = null;
      if (prevTopics[this.prevIndex + 1]) {
        this.prevIndex = this.prevIndex + 1;
        this.prevItem = prevTopics[this.prevIndex];
        this.currentInputValue = this.prevItem;
        this.topicInputRef.setNativeProps({
          text: null,
        });
        this.topicInputRef.setNativeProps({
          text: prevTopics[this.prevIndex],
        });
      } else {
        this.prevItem = null;
        this.prevIndex = null;
        this.currentInputValue = null;
        this.topicInputRef.setNativeProps({
          text: null,
        });
        setTimeout(() => {
          this.listRef.scrollToEnd({animated: true});
        }, 30);
      }
    }
  };

  render() {
    const {colors, toEdit} = this.props;
    const {
      titleFocused,
      descFocused,
      topics,
      visible,
      topicInputFoused,
    } = this.state;
    return (
      <Modal
        visible={visible}
        transparent={true}
        animated
        animationType="fade"
        onRequestClose={this.close}>
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
            onPress={this.close}
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
              maxHeight: '80%',
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
              <Icon name="book-outline" color={colors.accent} size={SIZE.lg} />
              <Text
                style={{
                  color: colors.accent,
                  fontFamily: WEIGHT.bold,
                  marginLeft: 5,
                  fontSize: SIZE.md,
                }}>
                {toEdit && toEdit.dateCreated
                  ? 'Edit Notebook'
                  : 'New Notebook'}
              </Text>
            </View>

            <TextInput
              ref={ref => (this.titleRef = ref)}
              style={{
                padding: pv - 5,
                borderWidth: 1.5,
                borderColor: titleFocused ? colors.accent : colors.nav,
                paddingHorizontal: ph,
                borderRadius: 5,
                fontSize: SIZE.sm,
                height: 35,
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
                this.title = value;
              }}
              onSubmitEditing={() => {
                this.descriptionRef.focus();
              }}
              placeholder="Title of notebook"
              placeholderTextColor={colors.icon}
            />
            <TextInput
              ref={ref => (this.descriptionRef = ref)}
              style={{
                padding: pv - 5,
                borderWidth: 1.5,
                borderColor: descFocused ? colors.accent : colors.nav,
                paddingHorizontal: ph,
                borderRadius: 5,
                height: 35,
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
                this.description = value;
              }}
              onSubmitEditing={() => {
                this.topicInputRef.focus();
              }}
              placeholder="write a description"
              placeholderTextColor={colors.icon}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 10,
              }}>
              <TextInput
                ref={ref => (this.topicInputRef = ref)}
                onChangeText={value => {
                  this.currentInputValue = value;
                  if (this.prevItem !== null) {
                    refs[this.prevIndex].setNativeProps({
                      text: this.prevIndex + 1 + '. ' + value,
                      style: {
                        borderBottomColor: colors.accent,
                      },
                    });
                  }
                }}
                blurOnSubmit={false}
                onFocus={() => {
                  this.setState({
                    topicInputFoused: true,
                  });
                }}
                onBlur={() => {
                  this.onSubmit();
                  this.setState({
                    topicInputFoused: false,
                  });
                }}
                onSubmitEditing={this.onSubmit}
                style={{
                  padding: pv - 5,
                  paddingHorizontal: 0,
                  borderRadius: 5,
                  borderWidth: 1.5,
                  height: 35,
                  fontSize: SIZE.sm,
                  borderColor: topicInputFoused ? colors.accent : colors.nav,
                  fontFamily: WEIGHT.regular,
                  color: colors.pri,
                  paddingHorizontal: ph,
                  width: '85%',
                  maxWidth: '85%',
                }}
                placeholder="Add a topic"
                placeholderTextColor={colors.icon}
              />
              <TouchableOpacity
                onPress={this.onSubmit}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1.5,
                  borderColor: topicInputFoused ? colors.accent : colors.nav,
                  borderRadius: 5,
                  width: '12%',
                  height: 35,
                }}>
                <Icon
                  name="plus"
                  size={SIZE.lg}
                  color={topicInputFoused ? colors.accent : colors.icon}
                />
              </TouchableOpacity>
            </View>

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
              keyExtractor={(item, index) => item + index.toString()}
              renderItem={({item, index}) => (
                <TopicItem
                  item={item}
                  onPress={(item, index) => {
                    this.prevIndex = index;
                    this.prevItem = item;
                    this.topicInputRef.setNativeProps({
                      text: item,
                    });
                    this.topicInputRef.focus();
                    this.currentInputValue = item;
                  }}
                  onDelete={this.onDelete}
                  index={index}
                  colors={colors}
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
                onPress={this.addNewNotebook}
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
                onPress={this.close}
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

const TopicItem = ({item, index, colors, onPress, onDelete}) => {
  const topicRef = ref => (refs[index] = ref);

  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
      }}>
      <TouchableOpacity
        style={{
          width: '100%',
        }}
        onPress={() => {
          onPress(item, index);
        }}>
        <TextInput
          ref={topicRef}
          editable={false}
          style={{
            padding: pv - 5,
            paddingHorizontal: 0,
            fontSize: SIZE.sm,
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            paddingHorizontal: ph,
            borderBottomWidth: 1.5,
            borderBottomColor: colors.nav,
            paddingRight: 40,
            width: '100%',
            maxWidth: '100%',
          }}
          defaultValue={index + 1 + '. ' + item}
          placeholder="Add a topic"
          placeholderTextColor={colors.icon}
        />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          onDelete(index);
        }}
        style={{
          justifyContent: 'center',
          alignItems: 'center',
          position: 'absolute',
          right: 0,
          borderColor: colors.nav,
          borderRadius: 5,
          width: 40,
          height: 40,
        }}>
        <Icon name="minus" size={SIZE.lg} color={colors.icon} />
      </TouchableOpacity>
    </View>
  );
};
