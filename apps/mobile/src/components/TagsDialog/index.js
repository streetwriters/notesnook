import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTracked } from '../../provider';
import { useTagStore } from '../../provider/stores';
import { eSubscribeEvent, eUnSubscribeEvent, ToastEvent } from '../../services/EventManager';
import Navigation from '../../services/Navigation';
import { db } from '../../utils/database';
import { eCloseTagsDialog, eOpenTagsDialog } from '../../utils/events';
import { SIZE } from '../../utils/size';
import { sleep } from '../../utils/time';
import Input from '../ui/input';
import { PressableButton } from '../ui/pressable';
import SheetWrapper from '../ui/sheet';
import Heading from '../ui/typography/heading';
import Paragraph from '../ui/typography/paragraph';
const TagsDialog = () => {
  const [state] = useTracked();
  const colors = state.colors;
  const [visible, setVisible] = useState(false);
  const [note, setNote] = useState(null);
  const allTags = useTagStore(state => state.tags);
  const [tags, setTags] = useState([]);
  const [query, setQuery] = useState(null);
  const inputRef = useRef();
  const actionSheetRef = useRef();

  useEffect(() => {
    eSubscribeEvent(eOpenTagsDialog, open);
    eSubscribeEvent(eCloseTagsDialog, close);
    return () => {
      eUnSubscribeEvent(eOpenTagsDialog, open);
      eUnSubscribeEvent(eCloseTagsDialog, close);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      console.log('sorting tags');
      sortTags();
    }
  }, [allTags, note, query, visible]);

  const sortTags = () => {
    let _tags = [...allTags];
    _tags = _tags.filter(t => t.type === 'tag');
    _tags = _tags.sort((a, b) => a.title.localeCompare(b.title));
    if (query) {
      _tags = _tags.filter(t => t.title.startsWith(query));
    }

    if (!note || !note.tags) {
      setTags(_tags);
      return;
    }
    let noteTags = [];
    for (let tag of note.tags) {
      let index = _tags.findIndex(t => t.title === tag);
      if (index !== -1) {
        noteTags.push(_tags[index]);
        _tags.splice(index, 1);
      }
    }
    noteTags = noteTags.sort((a, b) => a.title.localeCompare(b.title));
    let combinedTags = [...noteTags, ..._tags];
    setTags(combinedTags);
  };

  const open = item => {
    setNote(item);
    useTagStore.getState().setTags();
    sortTags();
    setVisible(true);
  };

  useEffect(() => {
    if (visible) {
      actionSheetRef.current?.show();
    }
  }, [visible]);

  const close = () => {
    setQuery(null);
    actionSheetRef.current?.hide();
  };

  const onSubmit = async () => {
    let _query = query;
    if (!_query || _query === '' || _query.trimStart().length == 0) {
      ToastEvent.show({
        heading: 'Tag field is empty',
        type: 'error',
        context: 'local'
      });
      return;
    }

    let tag = _query;
    setNote({ ...note, tags: note.tags ? [...note.tags, tag] : [tag] });
    setQuery(null);
    inputRef.current?.setNativeProps({
      text: ''
    });
    try {
      await db.notes.note(note.id).tag(tag);
      useTagStore.getState().setTags();
      setNote(db.notes.note(note.id).data);
    } catch (e) {
      ToastEvent.show({
        heading: 'Cannot add tag',
        type: 'error',
        message: e.message,
        context: 'local'
      });
    }

    Navigation.setRoutesToUpdate([
      Navigation.routeNames.NotesPage,
      Navigation.routeNames.Favorites,
      Navigation.routeNames.Notes
    ]);
  };

  return !visible ? null : (
    <SheetWrapper
      centered={false}
      fwdRef={actionSheetRef}
      onOpen={async () => {
        await sleep(300);
        inputRef.current?.focus();
      }}
      onClose={async () => {
        setQuery(null);
        setVisible(false);
      }}
    >
      <View
        style={{
          width: '100%',
          alignSelf: 'center',
          paddingHorizontal: 12,
          minHeight: '60%'
        }}
      >
        <Input
          button={{
            icon: 'magnify',
            color: colors.accent,
            size: SIZE.lg
          }}
          fwdRef={inputRef}
          autoCapitalize="none"
          onChangeText={v => {
            setQuery(db.tags.sanitize(v));
          }}
          onSubmit={onSubmit}
          height={50}
          placeholder="Search or add a tag"
        />

        <ScrollView
          nestedScrollEnabled
          overScrollMode="never"
          scrollToOverflowEnabled={false}
          keyboardDismissMode="none"
          keyboardShouldPersistTaps="always"
          onMomentumScrollEnd={() => {
            actionSheetRef.current?.handleChildScrollEnd();
          }}
        >
          {query && query !== tags[0]?.title ? (
            <PressableButton
              key={'query_item'}
              customStyle={{
                flexDirection: 'row',
                marginVertical: 5,
                justifyContent: 'space-between',
                padding: 12
              }}
              onPress={onSubmit}
              type="accent"
            >
              <Heading size={SIZE.sm} color={colors.light}>
                Add {`"` + '#' + query + `"`}
              </Heading>
              <Icon name="plus" color={colors.light} size={SIZE.lg} />
            </PressableButton>
          ) : null}
          {!allTags || allTags.length === 0 ? (
            <View
              style={{
                width: '100%',
                height: 200,
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <Heading size={50} color={colors.icon}>
                #
              </Heading>
              <Paragraph textBreakStrategy="balanced" color={colors.icon}>
                You do not have any tags.
              </Paragraph>
            </View>
          ) : null}

          {tags.map(item => (
            <TagItem key={item.title} tag={item} note={note} setNote={setNote} />
          ))}
        </ScrollView>
      </View>
    </SheetWrapper>
  );
};

export default TagsDialog;

const TagItem = ({ tag, note, setNote }) => {
  const [state] = useTracked();
  const colors = state.colors;

  const onPress = async () => {
    let prevNote = { ...note };
    try {
      if (prevNote.tags.indexOf(tag.title) !== -1) {
        await db.notes.note(note.id).untag(prevNote.tags[prevNote.tags.indexOf(tag.title)]);
      } else {
        await db.notes.note(note.id).tag(tag.title);
      }
      useTagStore.getState().setTags();
      setNote(db.notes.note(note.id).data);
    } catch (e) {}
    setTimeout(() => {
      Navigation.setRoutesToUpdate([
        Navigation.routeNames.NotesPage,
        Navigation.routeNames.Favorites,
        Navigation.routeNames.Notes
      ]);
    }, 1);
  };

  return (
    <PressableButton
      customStyle={{
        flexDirection: 'row',
        marginVertical: 5,
        justifyContent: 'space-between',
        padding: 12
      }}
      onPress={onPress}
      type={note && note.tags.findIndex(t => t === tag.title) !== -1 ? 'shade' : 'grayBg'}
    >
      <Heading
        size={SIZE.sm}
        color={
          note && note?.tags.findIndex(t => t === tag.title) !== -1 ? colors.accent : colors.pri
        }
      >
        {'#' + tag.title}
      </Heading>
      <Icon
        name={note && note?.tags.findIndex(t => t === tag.title) !== -1 ? 'minus' : 'plus'}
        color={
          note && note?.tags.findIndex(t => t === tag.title) !== -1 ? colors.accent : colors.accent
        }
        size={SIZE.lg}
      />
    </PressableButton>
  );
};
