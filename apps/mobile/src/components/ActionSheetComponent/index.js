import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  TextInput,
  FlatList,
} from 'react-native';
import {SIZE, pv, WEIGHT, opacity} from '../../common/common';
import Icon from 'react-native-vector-icons/Feather';
import NavigationService from '../../services/NavigationService';

import {db} from '../../../App';

import {useAppContext} from '../../provider/useAppContext';

const w = Dimensions.get('window').width;
const h = Dimensions.get('window').height;

let tagsInputRef;
export const ActionSheetComponent = ({
  close = () => {},
  item = {},
  setWillRefresh = value => {},
}) => {
  const {colors} = useAppContext();
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState(item ? item : {});

  let tagToAdd = null;
  let backPressCount = 0;

  const _onSubmit = () => {
    if (!tagToAdd || tagToAdd === '#') return;

    let tag = tagToAdd;
    if (tag[0] !== '#') {
      tag = '#' + tag;
    }
    if (tag.includes(' ')) {
      tag = tag.replace(' ', '_');
    }
    let oldProps = {...note};

    if (oldProps.tags.includes(tag)) {
      return;
    } else {
      oldProps.tags.push(tag);
    }

    tagsInputRef.setNativeProps({
      text: '#',
    });
    db.addNote({
      dateCreated: note.dateCreated,
      content: note.content,
      title: note.title,
      tags: oldProps.tags,
    });
    setNote({...db.getNote(note.dateCreated)});
    tagToAdd = '';
    setTimeout(() => {
      //tagsInputRef.focus();
    }, 300);
  };

  const _onKeyPress = event => {
    if (event.nativeEvent.key === 'Backspace') {
      if (backPressCount === 0 && !tagToAdd) {
        backPressCount = 1;

        return;
      }
      if (backPressCount === 1 && !tagToAdd) {
        backPressCount = 0;

        let tagInputValue = note.tags[note.tags.length - 1];
        let oldProps = {...note};
        if (oldProps.tags.length === 1) return;

        oldProps.tags.splice(oldProps.tags.length - 1);

        db.addNote({
          dateCreated: note.dateCreated,
          content: note.content,
          title: note.title,
          tags: oldProps.tags,
        });
        setNote({...db.getNote(note.dateCreated)});

        tagsInputRef.setNativeProps({
          text: tagInputValue,
        });

        setTimeout(() => {
          tagsInputRef.focus();
        }, 300);
      }
    }
  };

  return (
    <View>
      <View
        style={{
          width: w - 24,
          justifyContent: 'space-around',
          alignItems: 'center',
          marginHorizontal: 12,
          paddingVertical: 10,
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderBottomColor: colors.nav,
        }}>
        <TouchableOpacity
          onPress={() => {
            close();
            NavigationService.push('Folders', {
              note: note,
              title: 'Choose a notebook',
              isMove: true,
              hideMore: true,
              canGoBack: true,
            });
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',
              marginBottom: 5,
            }}
            name="arrow-right"
            size={SIZE.lg}
            color={colors.accent}
          />

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Move to
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            close();
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',
              marginBottom: 5,
            }}
            name="share-2"
            size={SIZE.lg}
            color={colors.accent}
          />
          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Share
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            close();
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',
              marginBottom: 5,
            }}
            name="external-link"
            size={SIZE.lg}
            color={colors.accent}
          />

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Export
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            close('delete');
          }}
          style={{
            alignItems: 'center',
          }}>
          <Icon
            style={{
              width: 50,
              height: 50,
              borderRadius: 100,
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              textAlignVertical: 'center',

              marginBottom: 5,
            }}
            name="trash"
            size={SIZE.lg}
            color={colors.accent}
          />

          <Text
            style={{
              fontFamily: WEIGHT.regular,
              fontSize: SIZE.xs + 1,
            }}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          paddingHorizontal: 12,
          width: '100%',
          marginVertical: 10,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {['red', 'yellow', 'green', 'blue', 'purple', 'orange', 'gray'].map(
          color => (
            <TouchableOpacity
              onPress={() => {
                let noteColors = note.colors;

                if (noteColors.includes(color)) {
                  noteColors.splice(color, 1);
                } else {
                  noteColors.push(color);
                }

                db.addNote({
                  dateCreated: note.dateCreated,
                  colors: noteColors,
                  content: note.content,
                  title: note.title,
                });
                setNote({...db.getNote(note.dateCreated)});
                setWillRefresh(true);
              }}
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'center',
                borderColor: colors.nav,
              }}>
              <View
                style={{
                  width: (w - 12) / 10,
                  height: (w - 12) / 10,
                  backgroundColor: color,
                  borderRadius: 100,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                {note.colors.includes(color) ? (
                  <Icon name="check" color="white" size={SIZE.lg} />
                ) : null}
              </View>
            </TouchableOpacity>
          ),
        )}
      </View>

      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginHorizontal: 12,
          marginBottom: 0,
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.nav,
        }}>
        {note.tags.map(tag => (
          <TouchableOpacity
            onPress={() => {
              let oldProps = {...note};

              oldProps.tags.splice(oldProps.tags.indexOf(tag), 1);
              db.addNote({
                dateCreated: note.dateCreated,
                content: note.content,
                title: note.title,
                tags: oldProps.tags,
              });
              setNote({...db.getNote(note.dateCreated)});
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              margin: 1,
              paddingHorizontal: 5,
              paddingVertical: 2.5,
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.sm,
                color: colors.pri,
              }}>
              <Text
                style={{
                  color: colors.accent,
                }}>
                {tag.slice(0, 1)}
              </Text>
              {tag.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TextInput
          style={{
            backgroundColor: 'transparent',
            minWidth: 100,
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            paddingHorizontal: 5,
            paddingVertical: 1.5,
            margin: 1,
          }}
          blurOnSubmit={false}
          ref={ref => (tagsInputRef = ref)}
          placeholderTextColor={colors.icon}
          onFocus={() => {
            setFocused(true);
          }}
          selectionColor={colors.accent}
          onBlur={() => {
            setFocused(false);
          }}
          placeholder="#hashtag"
          onChangeText={value => {
            tagToAdd = value;
            if (tagToAdd.length > 0) backPressCount = 0;
          }}
          onSubmitEditing={_onSubmit}
          onKeyPress={_onKeyPress}
        />
      </View>

      <FlatList
        style={{
          marginTop: 10,
        }}
        data={[
          {
            name: 'Pin',
            icon: 'tag',
            func: () => {
              db.pinItem(note.type, note.dateCreated);
              setNote({...db.getNote(note.dateCreated)});
              setWillRefresh(true);
            },
            close: false,
            check: true,
            on: note.pinned,
          },

          {
            name: 'Favorite',
            icon: 'star',
            func: () => {
              db.favoriteItem(note.type, note.dateCreated);
              setNote({...db.getNote(note.dateCreated)});
              setWillRefresh(true);
            },
            close: false,
            check: true,
            on: note.favorite,
          },
          {
            name: 'Add to Vault',
            icon: 'lock',
            func: () => {
              note.locked ? close('unlock') : close('lock');
            },
            close: true,
            check: true,
            on: note.locked,
          },
        ]}
        keyExtractor={(item, index) => item.name}
        renderItem={({item, index}) => (
          <TouchableOpacity
            activeOpacity={opacity}
            onPress={() => {
              item.func();
            }}
            style={{
              width: '100%',
              alignSelf: 'center',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingHorizontal: 12,
              paddingVertical: pv + 5,
              paddingTop: index === 0 ? 5 : pv + 5,
            }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Icon
                style={{
                  width: 30,
                }}
                name={item.icon}
                color={colors.pri}
                size={SIZE.md}
              />
              <Text
                style={{
                  fontFamily: WEIGHT.regular,
                  fontSize: SIZE.sm,
                  color: colors.pri,
                }}>
                {item.name}
              </Text>
            </View>
            {item.switch ? (
              <Icon
                size={SIZE.lg + 2}
                color={item.on ? colors.accent : colors.icon}
                name={item.on ? 'toggle-right' : 'toggle-left'}
              />
            ) : (
              undefined
            )}
            {item.check ? (
              <TouchableOpacity
                style={{
                  borderWidth: 2,
                  borderColor: item.on ? colors.accent : colors.icon,
                  width: 23,
                  height: 23,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 100,
                  paddingTop: 3,
                }}>
                {item.on ? (
                  <Icon size={SIZE.sm - 2} color={colors.accent} name="check" />
                ) : null}
              </TouchableOpacity>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};
