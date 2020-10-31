import React, {createRef, useState} from 'react';
import {Text, TextInput, TouchableOpacity, View} from 'react-native';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {sendNoteEditedEvent, ToastEvent} from '../../services/EventManager';
import {db} from '../../utils/DB';
import {SIZE, WEIGHT} from '../../utils/SizeUtils';

const tagsInputRef = createRef();

export const ActionSheetTagsSection = ({note, localRefresh}) => {
  const [state, dispatch] = useTracked();
  const {colors, tags, premiumUser} = state;
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  let tagToAdd = null;
  let backPressCount = 0;

  const _onSubmit = async () => {
    if (!tagToAdd || tagToAdd === '' || tagToAdd.trimStart().length == 0) {
      ToastEvent.show('Empty Tag', 'success');
      return;
    }
    let tag = tagToAdd;
    tag = tag.trim();
    if (tag.includes(' ')) {
      tag = tag.replace(' ', '_');
    }
    if (tag.includes(',')) {
      tag = tag.replace(',', '');
    }

    await db.notes.note(note.id).tag(tag);
    localRefresh(note.type);
    dispatch({type: Actions.TAGS});
    tagsInputRef.current?.setNativeProps({
      text: '',
    });
    tagToAdd = '';
  };

  const _onKeyPress = async (event) => {
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
  };

  const getSuggestions = (query) => {
   let _suggestions = tags.filter(t => t.title.startsWith(query))
   if (_suggestions && _suggestions.length > 0) {
    setSuggestions(_suggestions);
   }
  }

  const _renderTag = (tag) => (
    <TouchableOpacity
      key={tag}
      onPress={async () => {
        let oldProps = {...note};
        try {
          await db.notes
            .note(note.id)
            .untag(oldProps.tags[oldProps.tags.indexOf(tag)]);
          sendNoteEditedEvent(note.id, false, true);
          dispatch({type: Actions.TAGS});
        } catch (e) {
          sendNoteEditedEvent(note.id, false, true);
        }
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
          #
        </Text>
        {tag}
      </Text>
    </TouchableOpacity>
  );

  return note.id || note.dateCreated ? (
    <View
      style={{
        marginHorizontal: 12,
      }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 5,
          marginTop: 5,
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontFamily: WEIGHT.regular,
            fontSize: SIZE.xs,
            color: colors.pri,
          }}>
          {tags.filter(
            (o) =>
              o.noteIds.length >= 1 && !note.tags.find((t) => t === o.title),
          ).length === 0
            ? ''
            : 'Suggested: '}
        </Text>

        {[...suggestions,...suggestions,...suggestions,...suggestions].map((tag) => (
          <TouchableOpacity
            key={tag.title}
            onPress={() => {
              tagToAdd = tag.title;
              _onSubmit();
            }}
            style={{
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
              margin: 1,
              marginRight: 5,
              paddingHorizontal: 0,
              paddingVertical: 2.5,
            }}>
            <Text
              style={{
                fontFamily: WEIGHT.regular,
                fontSize: SIZE.xs,
                color: colors.pri,
              }}>
              <Text
                style={{
                  color: colors.accent,
                }}>
                #
              </Text>
              {tag.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          borderRadius: 5,
          borderWidth: 1.5,
          borderColor: focused ? colors.accent : colors.nav,
          alignItems: 'center',
          height: 40,
        }}>
        <TouchableOpacity
          onPress={() => {
            if (!premiumUser) {
              close('premium');
              return;
            }
            tagsInputRef.current?.focus();
          }}
          activeOpacity={1}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            zIndex: 10,
          }}>
          {!premiumUser ? (
            <Text
              style={{
                color: colors.accent,
                fontFamily: WEIGHT.regular,
                fontSize: 10,
                marginRight: 4,
                marginTop: 2.5,
              }}>
              PRO
            </Text>
          ) : null}
        </TouchableOpacity>
        {note && note.tags ? note.tags.map(_renderTag) : null}
        <TextInput
          style={{
            backgroundColor: 'transparent',
            minWidth: 100,
            zIndex: 10,
            fontFamily: WEIGHT.regular,
            color: colors.pri,
            paddingHorizontal: 5,
            paddingVertical: 0,
            height: 40,
            textAlignVertical: 'center',
          }}
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
            getSuggestions(value)
            if (tagToAdd.length > 0) backPressCount = 0;
          }}
          onSubmitEditing={_onSubmit}
          onKeyPress={_onKeyPress}
        />
      </View>
    </View>
  ) : null;
};
