import React, {createRef, useCallback, useEffect, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {ScrollView} from 'react-native-gesture-handler';
import {notesnook} from '../../../e2e/test.ids';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {
  eSendEvent,
  sendNoteEditedEvent,
  ToastEvent,
} from '../../services/EventManager';
import PremiumService from '../../services/PremiumService';
import {db} from '../../utils/DB';
import {eShowGetPremium} from '../../utils/Events';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';
import {sleep} from '../../utils/TimeUtils';
import {Button} from '../Button';
import {PressableButton} from '../PressableButton';
import Heading from '../Typography/Heading';
import Paragraph from '../Typography/Paragraph';

const tagsInputRef = createRef();
let prevQuery = null;
let tagToAdd = '';
let backPressCount = 0;

export const ActionSheetTagsSection = ({item, close}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser} = state;
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [note, setNote] = useState(item);

  const localRefresh = () => {
    toAdd = db.notes.note(note.id);
    if (toAdd) {
      toAdd = toAdd.data;
    } else {
      setTimeout(() => {
        toAdd = db.notes.note(note.id);
        if (toAdd) {
          toAdd = toAdd.data;
        }
      }, 500);
    }
    dispatch({type: Actions.NOTES});
    dispatch({type: Actions.TAGS});
    setNote({...toAdd});
  };

  const _onSubmit = useCallback(async () => {
    if (!tagToAdd || tagToAdd === '' || tagToAdd.trimStart().length == 0) {
      ToastEvent.show('Empty Tag', 'error', 'local');
      return;
    }

    async function add() {
      let tag = tagToAdd;
      tag = tag.trim();
      if (tag.includes(' ')) {
        tag = tag.replace(' ', '_');
      }
      if (tag.includes(',')) {
        tag = tag.replace(',', '');
      }

      try {
        await db.notes.note(note.id).tag(tag);
        localRefresh(note.type);
        dispatch({type: Actions.TAGS});
        tagsInputRef.current?.setNativeProps({
          text: '',
        });
        tagToAdd = '';
      } catch (e) {
        ToastEvent.show(e.message, 'error', 'local');
      }
    }

    await add();
  });

  useEffect(() => {
    if (prevQuery) {
      getSuggestions(prevQuery);
    } else {
      getSuggestions();
    }

    return () => {
      prevQuery = null;
    };
  }, [note]);

  const _onKeyPress = useCallback(async (event) => {
    if (event.nativeEvent.key === 'Backspace') {
      if (backPressCount === 0 && !tagToAdd) {
        backPressCount = 1;
        return;
      }
      if (backPressCount === 1 && !tagToAdd) {
        backPressCount = 0;

        let tagInputValue = note.tags[note.tags.length - 1];
        let oldProps = {...note};
        if (oldProps.tags.length === 0) return;

        await db.notes
          .note(note.id)
          .untag(oldProps.tags[oldProps.tags.length - 1]);

        localRefresh(note.type);

        tagsInputRef.current?.setNativeProps({
          text: tagInputValue,
        });
      }
    } else if (event.nativeEvent.key === ' ') {
      await _onSubmit();
      tagsInputRef.current?.setNativeProps({
        text: '',
      });
    } else if (event.nativeEvent.key === ',') {
      await _onSubmit();
      tagsInputRef.current?.setNativeProps({
        text: '',
      });
    }
  });

  const getSuggestions = (query) => {
    prevQuery = query;
    let _suggestions;
    if (query) {
      _suggestions = tags.filter(
        (t) =>
          t.title.startsWith(query) && !note.tags.find((n) => n === t.title),
      );
    } else {
      _suggestions = tags
        .sort(function (x, y) {
          return x.dateEdited - y.dateEdited;
        })
        .filter(
          (o) => o.noteIds.length >= 1 && !note.tags.find((t) => t === o.title),
        )
        .slice(0, 10);
    }

    setSuggestions(_suggestions);
  };

  return note.id || note.dateCreated ? (
    <View
      style={{
        marginHorizontal: 12,
      }}>
      <ScrollView
        horizontal
        contentContainerStyle={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 5,
        }}>
        {suggestions.length === 0 ? null : (
          <View
            key="suggestions"
            style={{
              justifyContent: 'center',
              alignItems: 'center',
              margin: 1,
              marginRight: 5,
              paddingHorizontal: 0,
              paddingVertical: 2.5,
            }}>
            <Heading size={SIZE.sm} color={colors.accent}>
              Suggestions:
            </Heading>
          </View>
        )}

        {suggestions.map((tag) => (
          <Button
            key={tag.title}
            onPress={() => {
              tagToAdd = tag.title;
              _onSubmit();
            }}
            title={'#' + tag.title}
            type="shade"
            height={22}
            style={{
              margin: 1,
              marginRight: 5,
              paddingHorizontal: 0,
              paddingVertical: 2.5,
              borderRadius: 100,
              paddingHorizontal: 12,
            }}
          />
        ))}
      </ScrollView>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          borderBottomWidth: 1.5,
          borderColor: focused ? colors.accent : colors.nav,
          alignItems: 'center',
        }}>
        {!premiumUser ? (
          <Paragraph
            color={colors.accent}
            size={SIZE.xs}
            style={{
              marginRight: 4,
              marginTop: 2.5,
              position: 'absolute',
              right: 0,
              top: 0,
            }}>
            PRO
          </Paragraph>
        ) : null}

        {note && note.tags
          ? note.tags.map((item) => (
              <TagItem key={item.title} tag={item} note={note} />
            ))
          : null}
        <TextInput
          style={{
            minWidth: 100,
            zIndex: 10,
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            paddingHorizontal: 5,
            paddingVertical: 0,
            height: 40,
            fontSize: SIZE.md,
            textAlignVertical: 'center',
          }}
          testID={notesnook.ids.dialogs.actionsheet.hashtagInput}
          autoCapitalize="none"
          textAlignVertical="center"
          blurOnSubmit={false}
          ref={tagsInputRef}
          placeholderTextColor={colors.icon}
          onFocus={() => {
            setFocused(true);
          }}
          selectionColor={colors.accent}
          onBlur={() => {
            setFocused(false);
          }}
          placeholder="#hashtag"
          onChangeText={(value) => {
            tagToAdd = value;
            getSuggestions(value);
            if (tagToAdd.length > 0) backPressCount = 0;
          }}
          onSubmitEditing={_onSubmit}
          onKeyPress={_onKeyPress}
        />
      </View>
    </View>
  ) : null;
};

const TagItem = ({tag, note}) => {
  const [state, dispatch] = useTracked();
  const {colors} = state;

  const onPress = async () => {
    let prevNote = {...note};
    try {
      await db.notes
        .note(note.id)
        .untag(prevNote.tags[prevNote.tags.indexOf(tag)]);
      sendNoteEditedEvent(note.id, false, true);
      dispatch({type: Actions.TAGS});
      localRefresh(note.type);
    } catch (e) {
      sendNoteEditedEvent(note.id, false, true);
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 8,
        backgroundColor: colors.shade,
        marginLeft: 5,
        borderRadius: 100,
        paddingVertical: 2,
      }}>
      <Paragraph size={SIZE.md} color={colors.accent}>
        #{tag}
      </Paragraph>
    </TouchableOpacity>
  );
};
